export default function Brand() {
  return (
    <div className="brandlockup">
      <a className="brand" href="./" aria-label="King Barber - início">
        <svg className="brand-crown" viewBox="0 0 64 38" aria-hidden="true">
          <path d="M10 28 5 9l15 9L32 4l12 14 15-9-5 19Z" fill="currentColor" />
          <path d="M12 33h40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="5" cy="7" r="3" fill="#98b96a" />
          <circle cx="32" cy="3" r="3" fill="#98b96a" />
          <circle cx="59" cy="7" r="3" fill="#98b96a" />
        </svg>
        <span className="brandname">
          <b>King</b> Barber
        </span>
        <svg className="brand-moustache" viewBox="0 0 100 30" aria-hidden="true">
          <path
            d="M50 12C41-1 27 2 23 13 18 24 8 21 3 14c1 14 17 18 29 13 9-3 15-8 18-8 3 0 9 5 18 8 12 5 28 1 29-13-5 7-15 10-20-1C73 2 59-1 50 12Z"
            fill="currentColor"
          />
        </svg>
      </a>
      <p className="brandnote">Menos cabelo, Mais cuidado</p>
    </div>
  );
}
