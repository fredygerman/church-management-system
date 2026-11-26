# Upload placeholder files for seeded DEV library items

DEV ONLY. Makes the 15 library rows inserted by `mobile-demo-data.sql` openable by uploading
small placeholder files to the **dev** Garage bucket under the exact `storage_key` values the
seed already references. No DB change is needed. Never run this against `gt-prod` or prod apps.

## Targets

- Bucket: `church-dev`
- Endpoint: `https://urban-storage.fredygerman.com` (region `garage`, path-style, SigV4)
- Credentials: `~/.config/church-test/garage-church-dev.env` on the devbox (mode 0600). Source it
  inside the script by name only. Never print, echo or commit its values.
- Keys: `demo-seed/not-uploaded/NNNN.<ext>` (from `mobile-demo-data.sql`, rows `aaaaaaaa-0005-4000-8000-0000000000NN`)

| Seed row | Key | Content-Type | Generator |
| --- | --- | --- | --- |
| 0001-0004, 0015 | `demo-seed/not-uploaded/000N.mp3` / `0015.mp3` | `audio/mpeg` | ~5 s silent MPEG-1 Layer III, 128 kbps, 44.1 kHz (stdlib) |
| 0005-0012, 0014 | `demo-seed/not-uploaded/00NN.pdf` | `application/pdf` | one-page PDF: title, author, seed description, footer "Sample content for development" (stdlib) |
| 0013 | `demo-seed/not-uploaded/0013.mp4` | `video/mp4` | 6 s test pattern + 440 Hz tone, 320x240, H.264/AAC (ffmpeg) |

Every file is under 100 KB. The seed's `size_bytes` values are left as-is; they are metadata only.

## Steps

1. Read the 15 rows from `packages/db/seeds/mobile-demo-data.sql` (keys, titles, authors, mime types).
2. On the devbox, create a fresh temp dir (`mktemp -d /tmp/church-demo-lib.XXXXXX`). Do not use `/tmp` directly.
3. Generate the files into `<tmp>/files` with a stdlib-only Python script (no pip available on the devbox):
   - PDFs: write a minimal PDF by hand (Helvetica, two font objects, xref table, `%%EOF`).
   - MP3: write `FF FB 90 64` followed by 413 zero bytes per frame, about 192 frames (~5 s).
   - MP4: no ffmpeg on the devbox. Generate it on a machine with ffmpeg, then copy it to `<tmp>/files/0013.mp4`:
     ```
     ffmpeg -f lavfi -i testsrc=size=320x240:rate=15 -f lavfi -i sine=frequency=440:sample_rate=44100 \
       -t 6 -map 0:v -map 1:a -c:v libx264 -preset veryfast -b:v 150k -pix_fmt yuv420p \
       -c:a aac -b:a 48k -movflags +faststart 0013.mp4
     ```
4. Upload with boto3 (already installed on the devbox), reading the env file by name only:
   ```
   python3 -I <tmp>/upload.py <tmp>/files https://urban-storage.fredygerman.com
   ```
   `upload.py` loops over the files, sets `Key = demo-seed/not-uploaded/<filename>` and the
   `ContentType` from the table above, calls `put_object` on bucket `church-dev`, then lists the prefix.
5. Verify the bucket listing: 15 objects under `demo-seed/not-uploaded/`.
6. Verify through the DEV API as the member test user. Credentials come from
   `~/.config/church-test/mobile-test-user.txt` on the Mac (read by name only; never print them):
   - `POST https://dev-api.mitoyabarakachurch.org/auth/login` (JSON `{email, password}`), token at `data.accessToken`
   - `POST https://dev-api.mitoyabarakachurch.org/library/resources/<id>/access` with `Authorization: Bearer <token>`
     (returns 201; the signed URL is under `data`)
   - `curl -s -o /dev/null -w "%{http_code} %{size_download}" "<signed url>"` must print `200` and a non-zero size.
   Check three items: 0005 (PDF), 0001 (MP3), 0013 (MP4). Do not print the URLs or tokens.
7. Delete the temp dir on the devbox (`rm -rf <tmp>`) and any temp files on the Mac.

## Rollback

Delete the 15 objects under `demo-seed/not-uploaded/` in `church-dev`. The DB rows are unchanged,
so the library items would then show as not uploaded again.

## Notes

- Audio is silent, not a tone. The stdlib generator cannot synthesise audio; use ffmpeg if a tone is needed.
- The generator and uploader are throwaway scripts that live only in the temp dir. Re-run the steps above to regenerate.
