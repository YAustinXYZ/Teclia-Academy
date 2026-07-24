import React from 'react';

export const Icon = ({ type, className }) => {
  const size = 24;
  switch (type) {
    case 'video':
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M17 9l4-2v10l-4-2V9z" fill="currentColor" />
        </svg>
      );
    case 'pdf':
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M13 2v6h6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'audio':
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 9v6a3 3 0 0 0 3 3h0" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="4" y="7" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M16 7v10a3 3 0 0 0 3 3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'image':
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" />
          <path d="M21 19l-6-5-4 4-3-3-4 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      );
    default:
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
  }
};

/* General-purpose UI icon set. Stroke-based, inherits currentColor. */
const UI_PATHS = {
  play: <path d="M8 5.5v13l11-6.5L8 5.5z" fill="currentColor" stroke="none" />,
  piano: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M8 5v9M12 5v9M16 5v9" />
    </>
  ),
  music: <><circle cx="7" cy="17.5" r="2.6" /><circle cx="17" cy="15.5" r="2.6" /><path d="M9.6 17.5V6.8l10-2v10.7" /></>,
  sheet: <><path d="M6 3h9l4 4v14H6V3z" /><path d="M15 3v4h4" /><path d="M9.5 12h5M9.5 15.5h5" /></>,
  star: <path d="M12 3.4l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8L12 3.4z" />,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4z" /><path d="M8 5H5a3 3 0 0 0 3 4M16 5h3a3 3 0 0 1-3 4" /><path d="M12 13v3.5M8.5 20h7M10 20v-2h4v2" /></>,
  video: <><rect x="3" y="6" width="14" height="12" rx="2" /><path d="M17 10l4-2.5v9L17 14v-4z" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3.5 13.5L12 18l8.5-4.5" /></>,
  book: <><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v18H7.5A2.5 2.5 0 0 0 5 22V4.5z" /><path d="M5 19.5A2.5 2.5 0 0 1 7.5 17H19" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" />,
  chart: <><path d="M4 20h16" /><path d="M7 20v-6M12 20V9M17 20V5" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  unlock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 7.7-1.5" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M4 4l16 16" /><path d="M10.6 6a9.8 9.8 0 0 1 1.4-.1c6 0 9.5 6.1 9.5 6.1a17 17 0 0 1-3 3.6M6.6 6.9A16.5 16.5 0 0 0 2.5 12S6 18.1 12 18.1a9.4 9.4 0 0 0 4-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  users: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" /><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.4 14.6a5.5 5.5 0 0 1 3.1 4.9" /></>,
  logout: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 8l-4 4 4 4M6 12h11" /></>,
  upload: <><path d="M12 16V5" /><path d="M7 9.5L12 4.5l5 5" /><path d="M4.5 19.5h15" /></>,
  paperclip: <path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7-7l8.4-8.5a3.4 3.4 0 0 1 4.8 4.8L10 17a1.8 1.8 0 0 1-2.5-2.5l7.3-7.2" />,
  download: <><path d="M12 4v11" /><path d="M7 10.5l5 5 5-5" /><path d="M4.5 19.5h15" /></>,
  clipboard: <><rect x="6" y="4.5" width="12" height="16" rx="2" /><path d="M9.5 4.5a2.5 2.5 0 0 1 5 0" /><path d="M9 10.5h6M9 14h6" /></>,
  keyboard: <><rect x="2.5" y="7" width="19" height="10" rx="2" /><path d="M6 10.5h.01M9.5 10.5h.01M13 10.5h.01M16.5 10.5h.01M7.5 14h9" /></>,
  file: <><path d="M6 2.5h8l4 4v15H6v-19z" /><path d="M14 2.5v4h4" /></>,
  warning: <><path d="M12 3.5L2.5 20h19L12 3.5z" /><path d="M12 10v4.5M12 17.5h.01" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  graduation: <><path d="M12 4L2.5 9 12 14l9.5-5L12 4z" /><path d="M6.5 11.5v4.5c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.5" /><path d="M21.5 9v5" /></>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  shield: <><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.5-4.3-1.5-7.5-4.9-7.5-9.5V6L12 3z" /><path d="M9 12l2.2 2.2L15.5 9.8" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M5.2 18.8l1.6-1.6M17.2 6.8l1.6-1.6" /></>,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" />,
};

export const UIIcon = ({ name, size = 20, className, strokeWidth = 1.7 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {UI_PATHS[name] || UI_PATHS.file}
  </svg>
);

export default Icon;
