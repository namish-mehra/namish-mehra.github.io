# Namish Mehra — portfolio

Rebuilt from the original Emergent site. React + Vite + Tailwind. No server is needed.

## Run on your computer

1. `npm install`
2. `npm run dev` and open http://localhost:5173

## Make the files to upload

1. `npm run build`
2. Upload the `dist` folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages).
3. On the host, send every unknown path to `index.html`, so that `/admin` works.
   Netlify: the file `public/_redirects` does this.

## Admin panel (/admin)

Open `/admin` on your site and log in with your Supabase admin email and password.
You can change the layout, cards, YouTube links, thumbnails, color grades, tags, texts and links.
Press **Save**: the live site updates at once. No new upload is needed.

One-time setup (already prepared):
1. Supabase > SQL Editor > New query: paste `supabase/setup.sql` and click **Run**.
2. Supabase > Authentication > Sign In / Providers: turn **off** "Allow new users to sign up".
3. Open `/admin`, log in, and press **Save** once.

The Supabase address and public key are in `.env`. Never put the secret key in this project.

Note: the link-preview title, description and share image (WhatsApp, Instagram) are written into the
page when the site is built. After you change them in /admin, build and upload the site again.

## Hosting on GitHub Pages

Live site: https://namishmehra.github.io/ (admin: https://namishmehra.github.io/admin).
Every push to `main` builds and deploys the site (`.github/workflows/deploy.yml`).
`.github/workflows/keepalive.yml` calls Supabase every 3 days so the free project is not paused.
If that job fails, GitHub sends an email: open Supabase and click "Resume project".
GitHub turns off scheduled jobs after 60 days with no commits; re-enable them in the Actions tab.

- Custom domain or `<user>.github.io` repository: no change needed.
- Project page (`<user>.github.io/<repo>/`): build with `VITE_BASE=/<repo>/`.
- `404.html` is made automatically, so `/admin` works on GitHub Pages.

## Built-in content

`src/data/content.json` is the copy the site shows if the database cannot be reached.

- Video card: set `title`, `tags`, `duration`, `youtubeUrl`, and `thumbnail`.
- Before/after card: set `beforeImage` and `afterImage`.
- Put image files in `public/images/` and write the path as `/images/your-file.jpg`.

Placeholder images now: `public/images/placeholder-*.svg`.

## Hero rings

The 3 oval rings are in `src/components/Hero.tsx` (`RINGS`). Change `duration` for speed
and `reverse` for direction.

## Contact form

It sends through Web3Forms with the access key in `src/components/Contact.tsx`.
