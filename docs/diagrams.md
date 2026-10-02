# System Diagrams

## Architecture
```mermaid
flowchart LR
  subgraph Frontend
    UI[React UI]
    Store[Context State]
  end

  subgraph Backend
    API[Express API]
    Auth[JWT Auth]
    Locks[Seat Lock Service]
  end

  subgraph Database
    Mongo[(MongoDB)]
  end

  UI --> Store
  Store --> API
  API --> Auth
  API --> Locks
  API --> Mongo
```

## ER Diagram
```mermaid
erDiagram
  USER ||--o{ BOOKING : creates
  MOVIE ||--o{ SHOW : schedules
  SHOW ||--o{ BOOKING : contains
  MOVIE ||--o{ BOOKING : references

  USER {
    string name
    string email
    string role
  }

  MOVIE {
    string title
    string status
    date releaseDate
  }

  SHOW {
    date date
    string time
    string theater
    string format
  }

  BOOKING {
    string bookingId
    string status
    number totalAmount
  }
```

## Booking Flow (Sequence)

The up-to-date sequence diagram (lock → create booking → Razorpay order →
checkout → verify with order/amount binding → atomic seat write) lives in
the README under "Architecture and booking flow".
