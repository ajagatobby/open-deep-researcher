import React from "react";

interface LogoProps {
  className?: string;
}

const TxLogo: React.FC<LogoProps> = ({ className = "w-full h-full" }) => {
  return (
    <svg
      viewBox="0 0 580 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M571.374 51.6953L503.096 126.382L580.001 210.001H527.659L477.071 154.792L426.484 210.001H373.996L450.754 126.089L382.768 51.6953H434.818L476.779 97.5321L519.033 51.6953H571.374Z"
        fill="currentColor"
      />
      <path
        d="M356.452 122.134C356.452 130.725 355.331 138.877 353.089 146.59C350.945 154.205 347.874 161.283 343.878 167.824C339.882 174.365 335.154 180.223 329.696 185.397C324.238 190.572 318.243 195.014 311.713 198.724C305.28 202.336 298.408 205.119 291.098 207.071C283.787 209.024 276.331 210 268.728 210H200.157C192.457 210 184.952 209.024 177.642 207.071C170.331 205.119 163.411 202.336 156.88 198.724C150.447 195.014 144.501 190.572 139.043 185.397C133.585 180.223 128.857 174.365 124.861 167.824C120.962 161.283 117.892 154.205 115.65 146.59C113.506 138.877 112.434 130.725 112.434 122.134V87.8661C112.434 74.9791 114.822 63.166 119.598 52.4268C124.471 41.6876 130.953 32.4616 139.043 24.749C147.133 16.9386 156.442 10.8856 166.969 6.58996C177.593 2.19665 188.656 0 200.157 0H268.728C276.331 0 283.787 0.97629 291.098 2.92887C298.408 4.88145 305.28 7.71269 311.713 11.4226C318.243 15.0349 324.238 19.4282 329.696 24.6025C335.154 29.7768 339.882 35.6346 343.878 42.1757C347.874 48.7169 350.945 55.8438 353.089 63.5565C355.331 71.1715 356.452 79.2747 356.452 87.8661V122.134ZM318.146 87.8661C318.146 80.3487 316.781 73.5146 314.052 67.364C311.323 61.2134 307.668 55.9414 303.086 51.5481C298.603 47.1548 293.388 43.7866 287.442 41.4435C281.497 39.1004 275.259 37.9777 268.728 38.0753H200.157C193.822 37.9777 187.632 39.1004 181.589 41.4435C175.643 43.689 170.331 47.0084 165.653 51.4017C161.072 55.6973 157.368 60.9693 154.541 67.2176C151.812 73.3682 150.447 80.251 150.447 87.8661V122.134C150.447 129.749 151.812 136.632 154.541 142.782C157.27 148.933 160.925 154.205 165.506 158.598C170.088 162.894 175.351 166.213 181.297 168.556C187.34 170.9 193.627 172.022 200.157 171.925H268.728C276.233 171.925 283.008 170.704 289.051 168.264C295.191 165.725 300.406 162.259 304.695 157.866C308.983 153.473 312.297 148.25 314.637 142.197C316.976 136.046 318.146 129.358 318.146 122.134V87.8661ZM301.624 60.0418C303.086 62.1897 304.061 64.5328 304.549 67.0711C305.036 69.5119 305.036 71.9526 304.549 74.3933C304.061 76.7364 303.086 78.9819 301.624 81.1297C300.26 83.1799 298.457 84.9372 296.215 86.4017L193.578 155.084C191.921 156.353 190.215 157.232 188.461 157.72C186.706 158.208 184.903 158.452 183.051 158.452C179.932 158.452 176.959 157.72 174.133 156.255C171.306 154.791 169.015 152.692 167.261 149.958C165.799 147.81 164.824 145.516 164.337 143.075C163.849 140.537 163.801 138.096 164.191 135.753C164.678 133.312 165.604 131.067 166.969 129.017C168.333 126.869 170.136 125.063 172.378 123.598L275.307 54.9163C277.452 53.4519 279.742 52.4756 282.179 51.9874C284.713 51.4993 287.15 51.4993 289.489 51.9874C291.926 52.4756 294.168 53.4031 296.215 54.7699C298.359 56.1367 300.162 57.894 301.624 60.0418Z"
        fill="currentColor"
      />
      <path
        d="M72.5183 210H34.3585V38.0753H0V0H72.5183V210Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default TxLogo;
