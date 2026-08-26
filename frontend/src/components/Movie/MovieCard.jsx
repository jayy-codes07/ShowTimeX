import React from "react";
import { Link } from "react-router-dom";
import { Star, Clock, Calendar, Ticket } from "lucide-react";
import { formatDuration } from "../../utils/formatDate";
import { IMAGE_PLACEHOLDER } from "../../utils/constants";

/**
 * MovieCard
 *
 * Fixed here:
 *  · Root was a <div onClick> wrapping a real <button> — not keyboard
 *    reachable, and nested interactive elements. Now a single <Link>, with
 *    "Book Tickets" as a visual affordance (a span), since the whole card
 *    navigates anyway.
 *  · Certificate badge was `text-black` on the brand fill (~2.5:1). Now uses
 *    the on-primary token.
 *  · Hover colour was driven by inline onMouseEnter/onMouseLeave handlers and
 *    inline styles. Now plain classes.
 *  · Poster had no lazy-loading and no intrinsic size — the grid shifted as
 *    images landed (CLS).
 */
const MovieCard = ({ movie }) => {
  const languages =
    movie.languages && movie.languages.length > 0 ? movie.languages : [];
  const visible = languages.slice(0, 2);
  const extra = Math.max(languages.length - visible.length, 0);

  // ratings arrive from TMDB as number | string | "" | null — only show a badge
  // when there is something real to display
  const rating =
    movie.rating === 0 || movie.rating == null
      ? null
      : String(movie.rating).trim() || null;

  return (
    <Link
      to={`/movie/${movie._id}`}
      aria-label={`${movie.title}${rating ? `, rated ${rating} out of 10` : ""}`}
      className="movie-card-shell group mx-auto flex h-full w-full max-w-[17rem] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-e1 transition-[transform,border-color,box-shadow] duration-base ease-out hover:-translate-y-1 hover:border-line-strong hover:shadow-e2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-focusring motion-reduce:hover:translate-y-0"
    >
      {/* Poster */}
      <div data-on-media className="relative aspect-[2/3] w-full overflow-hidden bg-surface-sunken">
        <img
          src={movie.poster || IMAGE_PLACEHOLDER}
          alt=""
          width={342}
          height={513}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
          onError={(e) => {
            e.currentTarget.src = IMAGE_PLACEHOLDER;
          }}
        />

        {/* Certificate — top left */}
        {movie.certificate ? (
          <span className="absolute left-3 top-3 z-20 inline-flex items-center justify-center rounded-full bg-brand px-2.5 py-1 text-[10px] font-extrabold uppercase leading-none tracking-wide text-content-on-primary shadow-e1">
            {movie.certificate}
          </span>
        ) : null}

        {/* Rating — top right. The pill sets the text colour so the star and
            the number always travel together. */}
        {rating ? (
          <span className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-content-media shadow-e1">
            <Star
              className="h-3.5 w-3.5 fill-warning text-warning"
              aria-hidden="true"
            />
            <span className="text-[11px] font-bold leading-none [font-variant-numeric:tabular-nums]">
              {rating}
            </span>
          </span>
        ) : null}

        {/* Hover affordance — presentational; the whole card is the link */}
        <span
          aria-hidden="true"
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 opacity-0 transition-opacity duration-base group-hover:opacity-100 motion-reduce:transition-none"
        >
          <span className="inline-flex translate-y-3 items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 font-bold text-content-on-primary shadow-e2 transition-transform duration-base ease-out group-hover:translate-y-0 motion-reduce:translate-y-0">
            <Ticket className="h-4 w-4" />
            Book Tickets
          </span>
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-grow flex-col p-4">
        <h3 className="movie-card-title mb-2 line-clamp-2 min-h-[2.5em] font-display text-[18px] font-bold leading-[1.25] tracking-[-0.012em] text-content transition-colors duration-base sm:text-[19px]">
          {movie.title}
        </h3>

        {visible.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {visible.map((language) => (
              <span
                key={language}
                className="rounded-md border border-line bg-surface-hover px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-content-secondary"
              >
                {language}
              </span>
            ))}
            {extra > 0 ? (
              <span className="rounded-md border border-line bg-surface-hover px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                +{extra}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex w-full items-center justify-between border-t border-line pt-3 text-body-sm font-medium text-content-muted">
          {movie.duration ? (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand-text" aria-hidden="true" />
              {formatDuration(movie.duration)}
            </span>
          ) : (
            <span />
          )}

          {movie.releaseDate ? (
            <span className="flex items-center gap-1.5 [font-variant-numeric:tabular-nums]">
              <Calendar
                className="h-3.5 w-3.5 text-brand-text"
                aria-hidden="true"
              />
              {new Date(movie.releaseDate).getFullYear()}
            </span>
          ) : (
            <span />
          )}
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
