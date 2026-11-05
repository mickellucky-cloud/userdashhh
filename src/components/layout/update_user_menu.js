const fs = require('fs');
const file = 'C:/Users/Loliya.DESKTOP-A3QATVT/.gemini/antigravity/scratch/okntoken-web/okntoken-web-main/src/components/layout/user-menu.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the DropdownMenuTrigger button styling
const target = `      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('openMenu')}
          className="group inline-flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar>
            {user.photoUrl ? (
              <AvatarImage src={user.photoUrl} alt={displayName} />
            ) : null}
            <AvatarFallback>{initialsOf(user)}</AvatarFallback>
          </Avatar>
          <ChevronDown
            className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>`;

const replacement = `      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('openMenu')}
          className="group inline-flex h-11 items-center gap-2 rounded-full border border-[var(--okn-line,#26262D)] pl-1.5 pr-2.5 bg-transparent text-[var(--okn-tx,#F5F5F7)] transition-all hover:bg-[var(--okn-s2,#1B1B20)] cursor-pointer focus-visible:outline-none"
        >
          <div className="size-8 rounded-full bg-[#7A12F5] text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-xs">
            {initialsOf(user)}
          </div>
          <ChevronDown
            className="size-3.5 shrink-0 text-[var(--okn-mut,#A3A3AF)] transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated UserMenu trigger button!');
} else {
  console.log('Target not found in user-menu.tsx, check file text.');
}
