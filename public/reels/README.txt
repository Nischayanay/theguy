Drop reel MP4s here with these exact names. Each one replaces the poster of the same name in /ig.

what-we-do.mp4       instagram.com/theguy/reel/Dd-kvNbNjb6/        Itinerary: Day 1
behind-scenes.mp4    instagram.com/theguy/reel/DfecgHuOgh3/        Itinerary: Days 2-3
post-everything.mp4  instagram.com/theguy/reel/DWHe0jUD8M7/        Itinerary: Days 4-30
thank-me-later.mp4   instagram.com/theguy/reel/DfYNB8dvTU4/        Itinerary: Next month
100k-gained.mp4      instagram.com/contentautopilot/reel/DbHilrEAVOg/  Arrivals: 100K in 47 days

Tip: compress before dropping in (web, muted, ~720px tall):
ffmpeg -i in.mp4 -an -vf "scale=-2:720" -c:v libx264 -crf 26 -preset slow -movflags +faststart out.mp4
