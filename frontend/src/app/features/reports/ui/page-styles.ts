/** Estilos compartidos por las páginas de reportes (encabezado, estados vacíos). */
export const PAGE_STYLES = `
  :host { display: grid; gap: 20px; animation: rise 280ms var(--ease); }
  .page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .page-head h1 { font-size: 26px; font-weight: 700; }
  .page-head p { color: var(--text-2); margin-top: 4px; }
  .head-actions { display: flex; gap: 8px; }
  .desktop-only { display: none; }
  @media (min-width: 768px) {
    .desktop-only { display: inline-flex; }
    .page-head h1 { font-size: 30px; }
  }
  .empty {
    display: grid;
    justify-items: center;
    gap: 10px;
    padding: 48px 24px;
    text-align: center;
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-lg);
    background: var(--surface);
  }
  .empty-icon {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: var(--accent-soft);
    color: var(--accent-text);
    margin-bottom: 4px;
  }
  .empty h2 { font-size: 18px; }
  .empty p { max-width: 360px; color: var(--text-2); }
  .empty .btn { margin-top: 8px; }
`;
