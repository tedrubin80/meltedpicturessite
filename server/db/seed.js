/**
 * Seed sample published films for local/dev use.
 * Safe to re-run: skips titles that already exist (by slug).
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'melted_pictures',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const films = [
  {
    title: 'The Hollow Signal',
    slug: 'the-hollow-signal',
    synopsis: 'When a radio astronomer receives a transmission from deep space, she discovers that some signals should never be answered.',
    full_description: 'A remote observatory. A pattern that should not exist. The Hollow Signal follows an astronomer pulled into a transmission that rewrites what she trusts about the night sky — and herself.',
    youtube_id: '',
    year: 2025,
    genre: 'scifi-horror',
    duration: '18 min',
    rating: 'TV-MA',
    featured: true,
    status: 'published',
    poster_url: '/images/film-1.jpg',
    backdrop_url: '/images/featured-bg.jpg',
    tags: 'ai, sci-fi, horror',
  },
  {
    title: 'Beneath the Skin',
    slug: 'beneath-the-skin',
    synopsis: 'A forensic artist reconstructs faces from crime scenes — until the faces start looking back.',
    full_description: 'Psychological dread meets clinical precision as identity dissolves one sketch at a time.',
    youtube_id: '',
    year: 2025,
    genre: 'psychological-thriller',
    duration: '22 min',
    rating: 'TV-MA',
    featured: false,
    status: 'published',
    poster_url: '/images/film-2.jpg',
    backdrop_url: '',
    tags: 'ai, thriller',
  },
  {
    title: 'The Last Frame',
    slug: 'the-last-frame',
    synopsis: 'Found footage from a vanished film crew reveals something editing was never meant to capture.',
    full_description: 'What begins as a recovered hard drive becomes a recursive nightmare of images that should not exist.',
    youtube_id: '',
    year: 2024,
    genre: 'found-footage',
    duration: '16 min',
    rating: 'TV-MA',
    featured: false,
    status: 'published',
    poster_url: '/images/film-3.jpg',
    backdrop_url: '',
    tags: 'ai, horror, found-footage',
  },
  {
    title: 'Echo Chamber',
    slug: 'echo-chamber',
    synopsis: 'A podcaster investigating online hauntings finds the hauntings are listening back.',
    full_description: 'Supernatural thriller about virality, grief, and rooms that amplify the wrong voice.',
    youtube_id: '',
    year: 2024,
    genre: 'supernatural-thriller',
    duration: '20 min',
    rating: 'TV-14',
    featured: false,
    status: 'published',
    poster_url: '/images/film-4.jpg',
    backdrop_url: '',
    tags: 'ai, thriller, supernatural',
  },
  {
    title: 'Static Minds',
    slug: 'static-minds',
    synopsis: 'Corporate neurotech promises focus. The side effects broadcast something else entirely.',
    full_description: 'Sci-fi thriller set inside a startup that sold attention — and bought nightmares.',
    youtube_id: '',
    year: 2024,
    genre: 'scifi',
    duration: '19 min',
    rating: 'TV-14',
    featured: false,
    status: 'published',
    poster_url: '/images/film-5.jpg',
    backdrop_url: '',
    tags: 'ai, sci-fi',
  },
  {
    title: 'The Inheritance',
    slug: 'the-inheritance',
    synopsis: 'An ancestral estate leaves more than property — it leaves instructions written in bloodline code.',
    full_description: 'Gothic horror about legacy, architecture, and the cost of belonging.',
    youtube_id: '',
    year: 2024,
    genre: 'gothic-horror',
    duration: '24 min',
    rating: 'TV-MA',
    featured: false,
    status: 'published',
    poster_url: '/images/film-6.jpg',
    backdrop_url: '',
    tags: 'ai, gothic, horror',
  },
  {
    title: 'Dead Air',
    slug: 'dead-air',
    synopsis: 'A late-night radio host takes a call that ends every broadcast afterward.',
    full_description: 'A short burst of horror about silence, frequency, and the last listener.',
    youtube_id: '',
    year: 2024,
    genre: 'short',
    duration: '8 min',
    rating: 'TV-14',
    featured: false,
    status: 'published',
    poster_url: '/images/film-7.jpg',
    backdrop_url: '',
    tags: 'ai, horror, short',
  },
  {
    title: 'The Loop',
    slug: 'the-loop',
    synopsis: 'A delivery driver realizes the same street, same hour, same crash — forever.',
    full_description: 'A sci-fi short about repetition, free will, and the moment the pattern notices you.',
    youtube_id: '',
    year: 2024,
    genre: 'short',
    duration: '9 min',
    rating: 'PG-13',
    featured: false,
    status: 'published',
    poster_url: '/images/film-8.jpg',
    backdrop_url: '',
    tags: 'ai, sci-fi, short',
  },
];

async function seed() {
  console.log('Seeding Melted Pictures films...\n');

  try {
    let inserted = 0;
    let skipped = 0;

    for (const film of films) {
      const existing = await pool.query('SELECT id FROM films WHERE slug = $1', [film.slug]);
      if (existing.rows.length > 0) {
        console.log(`  skip  ${film.slug}`);
        skipped += 1;
        continue;
      }

      await pool.query(
        `INSERT INTO films (
          title, slug, synopsis, full_description, youtube_id, year, genre,
          duration, rating, director, writer, poster_url, backdrop_url,
          tags, status, featured
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16
        )`,
        [
          film.title,
          film.slug,
          film.synopsis,
          film.full_description,
          film.youtube_id || null,
          film.year,
          film.genre,
          film.duration,
          film.rating,
          'Melted Pictures',
          'Melted Pictures',
          film.poster_url || null,
          film.backdrop_url || null,
          film.tags || null,
          film.status,
          film.featured,
        ]
      );
      console.log(`  add   ${film.slug}`);
      inserted += 1;
    }

    console.log(`\nDone. Inserted ${inserted}, skipped ${skipped}.\n`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
