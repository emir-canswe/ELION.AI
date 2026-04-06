/** Referans görseldeki kulaklıklı asistan silüeti — neon glow */
export default function AiAvatar({ listening }) {
    return (
        <div className={`elion-ai-avatar ${listening ? "elion-ai-avatar--pulse" : ""}`} aria-hidden>
            <svg
                className="elion-ai-avatar__svg"
                viewBox="0 0 220 260"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <filter id="elionAvatarGlow" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="8" result="b" />
                        <feMerge>
                            <feMergeNode in="b" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="elionAvatarGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#0088ff" stopOpacity="0.65" />
                    </linearGradient>
                </defs>
                {/* Kulaklık bandı */}
                <path
                    d="M 38 95 C 38 45 78 18 110 18 C 142 18 182 45 182 95"
                    stroke="url(#elionAvatarGrad)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                    filter="url(#elionAvatarGlow)"
                    opacity="0.9"
                />
                {/* Sol kulaklık */}
                <rect
                    x="28"
                    y="88"
                    rx="14"
                    width="34"
                    height="72"
                    fill="rgba(0, 240, 255, 0.12)"
                    stroke="#00f0ff"
                    strokeWidth="2"
                />
                {/* Sağ kulaklık */}
                <rect
                    x="158"
                    y="88"
                    rx="14"
                    width="34"
                    height="72"
                    fill="rgba(0, 240, 255, 0.12)"
                    stroke="#00f0ff"
                    strokeWidth="2"
                />
                {/* Yüz */}
                <ellipse
                    cx="110"
                    cy="118"
                    rx="48"
                    ry="54"
                    fill="rgba(0, 40, 55, 0.5)"
                    stroke="url(#elionAvatarGrad)"
                    strokeWidth="2.5"
                    filter="url(#elionAvatarGlow)"
                />
                {/* Gözler */}
                <ellipse cx="88" cy="112" rx="8" ry="10" fill="#00f0ff" opacity="0.85" />
                <ellipse cx="132" cy="112" rx="8" ry="10" fill="#00f0ff" opacity="0.85" />
                {/* Gülümseme */}
                <path
                    d="M 78 138 Q 110 162 142 138"
                    stroke="#00f0ff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.75"
                />
                {/* Gövde */}
                <path
                    d="M 70 175 L 70 230 Q 110 252 150 230 L 150 175 Q 110 188 70 175 Z"
                    fill="rgba(0, 60, 80, 0.35)"
                    stroke="url(#elionAvatarGrad)"
                    strokeWidth="2"
                    opacity="0.95"
                />
            </svg>
        </div>
    );
}
