// Business rule: a single booking (and therefore a single lock request) may
// never cover more than this many seats. Authoritative — the frontend limit is
// only UX. Shared by showController (lock) and bookingController (create).
const MAX_SEATS_PER_BOOKING = 10;

const normalizeSeat = (seat) => {
  const row = typeof seat?.row === "string" ? seat.row.trim().toUpperCase() : "";
  const number = Number(seat?.number);
  return { row, number };
};

const uniqueSeats = (seats) => {
  const map = new Map();
  for (const seat of Array.isArray(seats) ? seats : []) {
    const normalized = normalizeSeat(seat);
    if (!normalized.row || !Number.isFinite(normalized.number)) continue;
    const key = `${normalized.row}:${normalized.number}`;
    if (!map.has(key)) map.set(key, normalized);
  }
  return Array.from(map.values());
};

const getActiveLocks = (show, now = new Date()) => {
  const locks = Array.isArray(show?.seatLocks) ? show.seatLocks : [];
  return locks.filter((lock) => lock.expiresAt && new Date(lock.expiresAt) > now);
};

const flattenLockedSeats = (locks) => {
  const out = [];
  for (const lock of locks) {
    for (const seat of lock.seats || []) {
      out.push({ row: seat.row, number: seat.number });
    }
  }
  return out;
};

const getMyLockedSeats = (locks, userId) => {
  if (!userId) return [];
  const out = [];
  for (const lock of locks) {
    if (lock.user && lock.user.toString() === userId.toString()) {
      for (const seat of lock.seats || []) {
        out.push({ row: seat.row, number: seat.number });
      }
    }
  }
  return out;
};

const getMyLockExpiresAt = (locks, userId) => {
  if (!userId) return null;
  let latest = null;
  for (const lock of locks) {
    if (lock.user && lock.user.toString() === userId.toString()) {
      const exp = lock.expiresAt ? new Date(lock.expiresAt) : null;
      if (exp && (!latest || exp > latest)) {
        latest = exp;
      }
    }
  }
  return latest ? latest.toISOString() : null;
};

const isSeatLockedByOther = (locks, seat, userId) => {
  const key = `${seat.row}:${seat.number}`;
  return locks.some((lock) => {
    if (!lock.user) return false;
    if (userId && lock.user.toString() === userId.toString()) return false;
    return (lock.seats || []).some((s) => `${s.row}:${s.number}` === key);
  });
};

const buildLockResponse = (show, userId) => {
  const activeLocks = getActiveLocks(show);
  return {
    lockedSeats: flattenLockedSeats(activeLocks),
    myLockedSeats: getMyLockedSeats(activeLocks, userId),
    myLockExpiresAt: getMyLockExpiresAt(activeLocks, userId),
  };
};

const removeUserLockedSeats = (show, userId, seatsToRemove) => {
  const now = new Date();
  const activeLocks = getActiveLocks(show, now);
  const removeSet = new Set(
    uniqueSeats(seatsToRemove).map((s) => `${s.row}:${s.number}`)
  );

  const remainingLocks = [];
  let mySeats = [];
  let myExpiresAt = null;

  for (const lock of activeLocks) {
    if (lock.user && lock.user.toString() === userId.toString()) {
      mySeats = lock.seats || [];
      myExpiresAt = lock.expiresAt;
    } else {
      remainingLocks.push(lock);
    }
  }

  if (removeSet.size > 0) {
    const remainingSeats = mySeats.filter(
      (s) => !removeSet.has(`${s.row}:${s.number}`)
    );
    if (remainingSeats.length > 0 && myExpiresAt && new Date(myExpiresAt) > now) {
      remainingLocks.push({
        user: userId,
        seats: remainingSeats,
        expiresAt: myExpiresAt,
        createdAt: now,
      });
    }
  }

  show.seatLocks = remainingLocks;
  return buildLockResponse(show, userId);
};

const toPlainSeats = (seats) =>
  uniqueSeats(seats).map((s) => ({ row: s.row, number: s.number }));

// Query filter that matches the show ONLY IF none of `seats` is already in
// bookedSeats and none is inside another user's unexpired lock. Used as the
// filter of a single updateOne so the check and the write are one atomic
// server-side operation: of two concurrent writers for the same seat, exactly
// one matches (the other sees matchedCount === 0).
const seatConflictFilter = (seats, userId, now = new Date()) => {
  const plain = toPlainSeats(seats);
  return {
    $nor: [
      ...plain.map((seat) => ({
        "bookedSeats.seats": { $elemMatch: { row: seat.row, number: seat.number } },
      })),
      ...plain.map((seat) => ({
        seatLocks: {
          $elemMatch: {
            user: { $ne: userId },
            expiresAt: { $gt: now },
            seats: { $elemMatch: { row: seat.row, number: seat.number } },
          },
        },
      })),
    ],
  };
};

// Atomically (re)place this user's lock on `show` with `seats` merged into any
// seats they already hold, pruning expired locks. Returns the updated show,
// or null when a seat is booked or held by someone else.
const acquireSeatLock = async (show, userId, seats, holdMinutes) => {
  const Show = require("../models/Show");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + holdMinutes * 60 * 1000);
  const requested = toPlainSeats(seats);
  if (requested.length === 0) return null;

  const mySeats = getMyLockedSeats(getActiveLocks(show, now), userId);
  const mergedSeats = toPlainSeats([...mySeats, ...requested]);

  const result = await Show.updateOne(
    { _id: show._id, ...seatConflictFilter(requested, userId, now) },
    [
      {
        $set: {
          seatLocks: {
            $concatArrays: [
              {
                $filter: {
                  input: { $ifNull: ["$seatLocks", []] },
                  cond: {
                    $and: [
                      { $ne: ["$$this.user", userId] },
                      { $gt: ["$$this.expiresAt", now] },
                    ],
                  },
                },
              },
              [{ user: userId, seats: mergedSeats, expiresAt, createdAt: now }],
            ],
          },
        },
      },
    ]
  );

  if (result.matchedCount === 0) return null;
  return Show.findById(show._id);
};

// Atomically move `seats` from this user's lock into bookedSeats. Returns
// true when the seats were written, false when any seat was taken meanwhile.
const confirmSeats = async (show, userId, seats) => {
  const Show = require("../models/Show");
  const plain = toPlainSeats(seats);
  const result = await Show.updateOne(
    { _id: show._id, ...seatConflictFilter(plain, userId, new Date()) },
    {
      $push: { bookedSeats: { date: show.date, time: show.time, seats: plain } },
      $pull: { seatLocks: { user: userId } },
    }
  );
  return result.matchedCount > 0;
};

module.exports = {
  MAX_SEATS_PER_BOOKING,
  normalizeSeat,
  uniqueSeats,
  getActiveLocks,
  flattenLockedSeats,
  getMyLockedSeats,
  getMyLockExpiresAt,
  isSeatLockedByOther,
  buildLockResponse,
  removeUserLockedSeats,
  seatConflictFilter,
  acquireSeatLock,
  confirmSeats,
};
