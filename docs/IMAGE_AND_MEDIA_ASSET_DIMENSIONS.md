# IMAGE_AND_MEDIA_ASSET_DIMENSIONS.md
Target Reference: CITY_ADMIN_DASHBOARD.md & Public UI Interfaces
Storage Bucket: Unified Supabase storage bucket universal-media

## 1. Master Dimension Quick Reference
Asset Category	Field / Placement Name	Aspect Ratio	Target Dimensions (W × H)	Minimum Resolution	Max File Size	Permitted Formats
Immersive 360°	panoramas.equirectangular_url	2:1	4096 × 2048 px (4K) / 8192 × 4096 px (8K)	2048 × 1024 px	50 MB (img) / 2 GB (video)	JPG, PNG, WebP, MP4
Immersive 360°	panoramas.thumbnail_url	2:1 or 16:9	800 × 400 px or 640 × 360 px	400 × 200 px	2 MB	JPG, PNG, WebP
Story Page	civic_stories.hero_image_url	3:2 or 16:9	1200 × 800 px or 1600 × 900 px	800 × 533 px	10 MB	JPG, PNG, WebP
Story Page	Inline Body Imagery	Flexible	Max width 1200 px (e.g. 1200 × 800 px)	600 px width	8 MB	JPG, PNG, WebP
Story / Object	og_image_url (Social Share)	1.91:1	1200 × 630 px	600 × 315 px	5 MB	JPG, PNG
Civic Object	hero_image_url (Fallback)	16:9 or 3:2	1600 × 900 px or 1200 × 800 px	800 × 450 px	10 MB	JPG, PNG, WebP
Civic Object	thumbnail_url (List Card)	16:9 or 4:3	640 × 360 px or 800 × 600 px	320 × 180 px	2 MB	JPG, PNG, WebP
Civic Object	media_urls (Archival Gallery)	Native	1600 – 2400 px on longest edge	800 px edge	15 MB	JPG, PNG, WebP
Sponsorship	story_promo	1:1 or 2:1	800 × 800 px or 1200 × 600 px	400 × 400 px	5 MB	JPG, PNG, WebP
Sponsorship	object_promo	1:1 or 2:1	800 × 800 px or 1200 × 600 px	400 × 400 px	5 MB	JPG, PNG, WebP
Sponsorship	timeline_promo	~8:3	1600 × 600 px or 1920 × 720 px	1200 × 450 px	8 MB	JPG, PNG, WebP
Sponsorship	homepage_promo	16:9 (or 4:3)	1920 × 1080 px or 1600 × 900 px	1280 × 720 px	8 MB	JPG, PNG, WebP
Sponsorship	logo (Sponsor Profile)	1:1	512 × 512 px	256 × 256 px	2 MB	SVG, PNG (transparent)
Sponsorship	banner (Generic wide)	4:1	1920 × 480 px or 1200 × 300 px	800 × 200 px	5 MB	JPG, PNG, WebP
Sponsorship	square (Generic square)	1:1	800 × 800 px or 1080 × 1080 px	400 × 400 px	5 MB	JPG, PNG, WebP
Sponsorship	360_promo (VR Placement)	2:1	4096 × 2048 px	2048 × 1024 px	30 MB	JPG, PNG
Search	Result Card (Desktop)	1:1	Displayed: 80 × 80 px (Source: ≥ 160 × 160 px)	80 × 80 px	1 MB	JPG, PNG, WebP
Search	Result Card (Mobile)	Card-wide	Displayed: 100% × 140 px (Source: ≥ 320 × 180 px)	320 × 140 px	2 MB	JPG, PNG, WebP
Explore Lander	Museum Bento Tiles	16:9 / 4:3	800 × 450 px or 800 × 600 px	400 × 300 px	3 MB	JPG, PNG, WebP
Explore Lander	Civic Library Shelf Items	3:4 / 1:1	600 × 800 px (portrait) / 600 × 600 px	300 × 400 px	3 MB	JPG, PNG, WebP
City Brand	Horizontal City Logo	Max 4:1	Vector SVG or 800 × 200 px	400 × 100 px	2 MB	SVG, PNG (transparent)
City Brand	Square Crest / Seal / Mark	1:1	Vector SVG or 512 × 512 px	256 × 256 px	2 MB	SVG, PNG (transparent)
City Brand	Codex Center Logo Slot	1:1	Displayed: 120 × 120 px (Source: ≥ 256 × 256 px)	120 × 120 px	1 MB	SVG, PNG (transparent)
City Brand	Favicons & Touch Icons	1:1	32 × 32, 48 × 48, 180 × 180, 512 × 512 px	32 × 32 px	1 MB	ICO, PNG, SVG
Civic Games	Game Tile / Cover Art	16:9 / 4:3	1200 × 675 px or 800 × 600 px	600 × 450 px	5 MB	JPG, PNG, WebP
Civic Games	Badge Icon (game_badges.icon_url)	1:1	Vector SVG or 256 × 256 px (displayed 32–64 px)	64 × 64 px	1 MB	SVG, PNG (transparent)
Civic Games	Player Avatar (avatar_url)	1:1	256 × 256 px (displayed 32–48 px circle)	128 × 128 px	2 MB	JPG, PNG, WebP
Hotspots	Custom Hotspot Icon	1:1	Vector SVG or 64 × 64 px (displayed 24 × 24 px)	24 × 24 px	500 KB	SVG, PNG (transparent)

##2. Detailed Domain Specifications
### 2.1 Immersive 360° Media (panoramas)
Equirectangular Projection: Must strictly maintain a 2:1 ratio (
width
=
2
×
height
width=2×height). Deviations cause spherical distortion or seam pinching in WebGL.
Hotspot UV Mapping: Hotspots use normalized coordinates on this 2:1 plane:
pan_x 
[
0.0
,
1.0
]
[0.0,1.0]: 0.5 = center, 0.0 = left edge, 1.0 = right edge (wraps).
pan_y 
[
0.0
,
1.0
]
[0.0,1.0]: 0.5 = horizon, 0.0 = zenith (+90° pitch), 1.0 = nadir (-90° pitch).
Storage Path: universal-media/cities/{city_id}/panoramas/{object_type}/{object_id}/{filename}


## 2.2 Sponsorship Modules (creative_assets)
Homepage Spotlight Tile: Rendered at 
≈
360
≈360–
420
 px
420 px height on desktop (full-width on mobile); upload size is 1920 × 1080 px or 1600 × 900 px (16:9).
Story & Object Promo: Flexible square (800 × 800 px) or landscape (1200 × 600 px).
Timeline Promo: Wide-format ribbon banner (1600 × 600 px or 1920 × 720 px).
Storage Path: sponsorships/{sponsor_id}/campaigns/{campaign_id}/{filename}

## 2.3 Search Result Thumbnails (SearchResultCard)
Desktop (≥ 768 px): Fixed 80 × 80 px (aspect-ratio: 1/1), border-radius: 4px, object-fit: cover.
Mobile (< 768 px): Full card width (100%) by 140 px height, border-radius: 4px 4px 0 0.

## 2.4 Validation Rules for the City Admin Dashboard Pipeline
Aspect Ratio Guard: Strict 2:1 validation on panoramas with 
≤
1
%
≤1% tolerance threshold.
Quality Ceilings & Floors: Warnings triggered on panoramas 
<
2048
×
1024
 px
<2048×1024 px, story heroes 
<
1200
×
600
 px
<1200×600 px, or sponsor creatives 
<
800
×
400
 px
<800×400 px.
Accessibility: Mandatory alt_text on all non-decorative assets (
≥
5
≥5 characters).