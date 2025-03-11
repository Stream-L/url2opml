export default function V0Logo({ className = "h-5 w-5" }: { className?: string }) {
  const combinedClassName = `focus-visible:ring-offset-background inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap text-nowrap border font-medium outline-none ring-blue-600 transition-[background,border-color,color,transform,opacity,box-shadow] focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:ring-0 has-[:focus-visible]:ring-2 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:ring-0 [&>svg]:pointer-events-none [&_svg]:shrink-0 border-transparent bg-transparent text-gray-900 hover:border-transparent focus:border-transparent focus-visible:border-transparent disabled:border-transparent disabled:bg-transparent disabled:text-gray-400 aria-disabled:border-transparent aria-disabled:bg-transparent aria-disabled:text-gray-400 px-4 text-sm has-[>kbd]:gap-3 has-[>kbd]:pr-[6px] rounded-lg border-none hover:bg-transparent focus:bg-transparent focus-visible:bg-transparent has-[>svg]:p-0 [&>svg]:size-8 size-8 ${className}`

  return (
    <a data-testid="header-logo" className={combinedClassName} href="/" tabIndex={-1}>
      <svg
        width="40"
        height="20"
        viewBox="0 0 40 20"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="size-10"
      >
        <path d="M23.3919 0H32.9188C36.7819 0 39.9136 3.13165 39.9136 6.99475V16.0805H36.0006V6.99475C36.0006 6.90167 35.9969 6.80925 35.9898 6.71766L26.4628 16.079C26.4949 16.08 26.5272 16.0805 26.5595 16.0805H36.0006V19.7762H26.5595C22.6964 19.7762 19.4788 16.6139 19.4788 12.7508V3.68923H23.3919V12.7508C23.3919 12.9253 23.4054 13.0977 23.4316 13.2668L33.1682 3.6995C33.0861 3.6927 33.003 3.68923 32.9188 3.68923H23.3919V0Z"></path>
        <path d="M13.7688 19.0956L0 3.68759H5.53933L13.6231 12.7337V3.68759H17.7535V17.5746C17.7535 19.6705 15.1654 20.6584 13.7688 19.0956Z"></path>
      </svg>
      <span className="sr-only">New Chat</span>
    </a>
  )
}

