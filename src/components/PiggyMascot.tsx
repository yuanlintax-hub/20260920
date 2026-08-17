import React from "react";

interface PiggyMascotProps {
  className?: string;
  pose?: "idle" | "happy" | "cheering" | "gold" | "magnet" | "chef";
  size?: number;
}

export const PiggyMascot: React.FC<PiggyMascotProps> = ({
  className = "",
  pose = "idle",
  size = 120,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label="彰化豚肉節吉祥物豚寶"
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-md transition-transform duration-300"
      >
        <defs>
          {/* Gradients */}
          <radialGradient id="piggySkin" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFCCD5" />
            <stop offset="60%" stopColor="#FFB3C1" />
            <stop offset="100%" stopColor="#FF8FA3" />
          </radialGradient>
          <radialGradient id="piggyCheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF4D6D" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FF4D6D" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="apronGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5383B" />
            <stop offset="100%" stopColor="#BA181B" />
          </linearGradient>
          <linearGradient id="goldCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFEE55" />
            <stop offset="60%" stopColor="#FFC107" />
            <stop offset="100%" stopColor="#FF9800" />
          </linearGradient>
          <linearGradient id="chefHatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0E1DD" />
          </linearGradient>
        </defs>

        {/* Ears */}
        <g id="ears">
          {/* Left Ear */}
          <path
            d="M 50 65 C 30 40 40 15 65 35 C 70 45 65 60 50 65 Z"
            fill="#FF8FA3"
            stroke="#C9184A"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M 52 55 C 40 38 48 25 60 38 Z"
            fill="#FF4D6D"
            opacity="0.45"
          />

          {/* Right Ear */}
          <path
            d="M 150 65 C 170 40 160 15 135 35 C 130 45 135 60 150 65 Z"
            fill="#FF8FA3"
            stroke="#C9184A"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M 148 55 C 160 38 152 25 140 38 Z"
            fill="#FF4D6D"
            opacity="0.45"
          />
        </g>

        {/* Body Base */}
        <ellipse
          cx="100"
          cy="140"
          rx="52"
          ry="44"
          fill="url(#piggySkin)"
          stroke="#C9184A"
          strokeWidth="3.5"
        />

        {/* Red Apron */}
        <path
          d="M 68 120 L 132 120 L 140 170 C 140 178 125 182 100 182 C 75 182 60 178 60 170 Z"
          fill="url(#apronGrad)"
          stroke="#590D22"
          strokeWidth="2.5"
        />
        {/* Apron Straps */}
        <path
          d="M 72 120 L 82 105 M 128 120 L 118 105"
          stroke="#A4161A"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Apron Pocket / Changhua text */}
        <path
          d="M 85 142 Q 100 148 115 142 L 112 162 Q 100 168 88 162 Z"
          fill="#FFF"
          opacity="0.9"
        />
        <text
          x="100"
          y="157"
          fontSize="11"
          fontWeight="bold"
          fill="#BA181B"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          彰化
        </text>

        {/* Feet */}
        <ellipse cx="78" cy="182" rx="14" ry="9" fill="#FF758F" stroke="#C9184A" strokeWidth="3" />
        <ellipse cx="122" cy="182" rx="14" ry="9" fill="#FF758F" stroke="#C9184A" strokeWidth="3" />

        {/* Arms */}
        {pose === "cheering" || pose === "happy" ? (
          <>
            {/* Arms Up */}
            <path
              d="M 52 125 C 32 100 25 80 40 75 C 50 72 58 90 62 110"
              fill="url(#piggySkin)"
              stroke="#C9184A"
              strokeWidth="3"
            />
            <path
              d="M 148 125 C 168 100 175 80 160 75 C 150 72 142 90 138 110"
              fill="url(#piggySkin)"
              stroke="#C9184A"
              strokeWidth="3"
            />
          </>
        ) : pose === "gold" ? (
          <>
            {/* Left Hand Holding Gold Coin */}
            <path
              d="M 56 125 C 40 135 45 155 65 148"
              fill="url(#piggySkin)"
              stroke="#C9184A"
              strokeWidth="3"
            />
            {/* Gold Coin */}
            <circle cx="42" cy="142" r="18" fill="url(#goldCoinGrad)" stroke="#E65100" strokeWidth="2.5" />
            <text x="42" y="147" fontSize="13" fontWeight="900" fill="#B26A00" textAnchor="middle">
              $
            </text>
            <path
              d="M 144 125 C 160 135 155 155 135 148"
              fill="url(#piggySkin)"
              stroke="#C9184A"
              strokeWidth="3"
            />
          </>
        ) : pose === "magnet" ? (
          <>
            {/* Magnet Hero Pose */}
            <path
              d="M 56 125 C 35 110 30 130 52 145"
              fill="url(#piggySkin)"
              stroke="#C9184A"
              strokeWidth="3"
            />
            {/* Magnetic Horseshoe */}
            <path
              d="M 30 115 C 20 100 45 85 55 100"
              stroke="#3B82F6"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 144 125 C 165 110 170 130 148 145"
              fill="url(#piggySkin)"
              stroke="#C9184A"
              strokeWidth="3"
            />
          </>
        ) : (
          <>
            {/* Normal / Chef Arms */}
            <ellipse cx="50" cy="132" rx="12" ry="16" fill="url(#piggySkin)" stroke="#C9184A" strokeWidth="3" />
            <ellipse cx="150" cy="132" rx="12" ry="16" fill="url(#piggySkin)" stroke="#C9184A" strokeWidth="3" />
          </>
        )}

        {/* Head */}
        <circle
          cx="100"
          cy="85"
          r="48"
          fill="url(#piggySkin)"
          stroke="#C9184A"
          strokeWidth="3.5"
        />

        {/* Cheeks */}
        <circle cx="68" cy="94" r="12" fill="url(#piggyCheek)" />
        <circle cx="132" cy="94" r="12" fill="url(#piggyCheek)" />

        {/* Eyes */}
        {pose === "happy" || pose === "cheering" ? (
          <>
            {/* Joyful Arc Eyes */}
            <path
              d="M 72 80 Q 80 72 88 80"
              stroke="#3A010F"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 112 80 Q 120 72 128 80"
              stroke="#3A010F"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : (
          <>
            {/* Cute Big Eyes with Highlights */}
            <ellipse cx="80" cy="78" rx="6" ry="8" fill="#3A010F" />
            <circle cx="82" cy="75" r="2.5" fill="#FFFFFF" />
            <ellipse cx="120" cy="78" rx="6" ry="8" fill="#3A010F" />
            <circle cx="122" cy="75" r="2.5" fill="#FFFFFF" />
          </>
        )}

        {/* Piggy Snout */}
        <ellipse
          cx="100"
          cy="94"
          rx="19"
          ry="14"
          fill="#FF758F"
          stroke="#C9184A"
          strokeWidth="3"
        />
        {/* Nostrils */}
        <ellipse cx="94" cy="94" rx="3.5" ry="5.5" fill="#A4161A" />
        <ellipse cx="106" cy="94" rx="3.5" ry="5.5" fill="#A4161A" />

        {/* Smiling Mouth */}
        <path
          d="M 90 114 Q 100 124 110 114"
          stroke="#C9184A"
          strokeWidth="3"
          strokeLinecap="round"
          fill="#FF4D6D"
        />

        {/* Chef Hat */}
        <g id="chefHat">
          {/* Hat Puff */}
          <path
            d="M 68 46 C 55 30 70 8 90 18 C 100 6 115 6 122 18 C 140 10 152 30 138 46 Z"
            fill="url(#chefHatGrad)"
            stroke="#590D22"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Hat Band */}
          <rect
            x="70"
            y="42"
            width="60"
            height="12"
            rx="3"
            fill="#FFFFFF"
            stroke="#590D22"
            strokeWidth="2.5"
          />
          {/* Gold Star on Hat */}
          <polygon
            points="100,44 102,49 107,49 103,52 105,57 100,54 95,57 97,52 93,49 98,49"
            fill="#FFC107"
          />
        </g>
      </svg>
    </div>
  );
};
