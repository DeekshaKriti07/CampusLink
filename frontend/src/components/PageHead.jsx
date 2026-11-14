function EditorialArt() {
  return (
    <div className="cl-editorial-art" aria-hidden="true">
      <svg viewBox="0 0 260 145" role="presentation">
        <path className="cl-art-orbit" d="M16 105c32-42 83-62 139-49 35 8 58 28 89 8" />
        <path className="cl-art-orbit second" d="M27 124c40-17 63-36 104-29 37 7 62 31 111 4" />
        <path className="cl-art-connector" d="M47 42c23 4 24 18 44 21 18 3 21-16 40-12 18 4 23 23 44 18" />
        <rect className="cl-art-notebook" x="54" y="20" width="61" height="78" rx="6" transform="rotate(-8 54 20)" />
        <path className="cl-art-notebook-line" d="M68 46h31M66 57h38M64 68h26" />
        <circle className="cl-art-pin" cx="102" cy="36" r="7" />
        <path className="cl-art-star" d="m181 30 4 11 11 4-11 4-4 11-4-11-11-4 11-4z" />
        <rect className="cl-art-card" x="148" y="73" width="65" height="41" rx="5" transform="rotate(7 148 73)" />
        <path className="cl-art-card-line" d="M160 91h37M159 99h25" />
        <circle className="cl-art-window" cx="226" cy="44" r="9" />
        <path className="cl-art-cross" d="M226 38v12M220 44h12" />
      </svg>
    </div>
  );
}
export default function PageHead({ eyebrow, title, copy, action }) {
  return (
    <header className="cl-page-head">
      <div className="cl-page-head-copy">
        <p className="cl-eyebrow">{eyebrow}</p>
        <h1 className="cl-page-title">{title}</h1>
        {copy && <p className="cl-page-copy">{copy}</p>}
      </div>
      <EditorialArt />
      {action}
    </header>
  );
}
