import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json({ error: "placeId is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is not configured" }, { status: 500 });
  }

  try {
    // Appel à l'API Place Details pour récupérer les photos
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json({ error: data.status, details: data }, { status: 400 });
    }

    if (!data.result.photos || data.result.photos.length === 0) {
      return NextResponse.json({ photos: [] });
    }

    // Transformer les références en URLs directes vers les images (max 10 photos)
    const photoUrls = data.result.photos.slice(0, 10).map((photo: any) => {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${apiKey}`;
    });

    return NextResponse.json({ photos: photoUrls });
  } catch (error) {
    console.error("Erreur lors de la récupération des photos:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
