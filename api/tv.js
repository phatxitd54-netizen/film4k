const SOURCE =
  "https://raw.githubusercontent.com/Gicnycjgfg/film4k-tv/refs/heads/main/film4k_tv.json";

export default async function handler(req, res) {
  try {
    const response = await fetch(SOURCE);

    if (!response.ok) {
      throw new Error(`Source HTTP ${response.status}`);
    }

    const data = await response.json();
    const channels = Array.isArray(data)
      ? data
      : data.channels || [];

    let m3u = "#EXTM3U\n";

    for (const ch of channels) {
      // Lấy URL stream
      const url = ch.url;
      if (!url) continue;

      const id = ch.id ?? "";
      const name = ch.name ?? "Unknown";
      const logo = ch.logo ?? "";
      const group = ch.group ?? "Khác";

      // Thông tin kênh
      m3u += `#EXTINF:-1 tvg-id="${escapeAttr(id)}" tvg-name="${escapeAttr(name)}" tvg-logo="${escapeAttr(logo)}" group-title="${escapeAttr(group)}",${name}\n`;

      // DASH
      if (/\.mpd(?:\?|$)/i.test(url)) {
        m3u += "#KODIPROP:inputstreamaddon=inputstream.adaptive\n";
        m3u += "#KODIPROP:inputstream.adaptive.manifest_type=dash\n";
        m3u += "#KODIPROP:inputstream.adaptive.license_type=clearkey\n";

        const licenseKey = `${ch.clearKey.keyId}:${ch.clearKey.key}`;

m3u += `#KODIPROP:inputstream.adaptive.license_key=${licenseKey}\n`;

      // URL stream
      m3u += `${url}\n`;
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
res.setHeader(
  "Cache-Control",
  "s-maxage=60, stale-while-revalidate=300"
);

res.status(200).send(m3u);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}
