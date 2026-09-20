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
      // Chỉ sử dụng URL
      if (!ch.url) continue;

      const id = ch.id ?? "";
      const name = ch.name ?? "Unknown";
      const logo = ch.logo ?? "";
      const group = ch.group ?? "Khác";
      const url = ch.url;

      m3u += `#EXTINF:-1 tvg-id="${escapeAttr(id)}" tvg-name="${escapeAttr(name)}" tvg-logo="${escapeAttr(logo)}" group-title="${escapeAttr(group)}",${name}\n`;

      /*
       * Nếu nguồn đã có KodiProp hoàn chỉnh,
       * giữ nguyên và đưa vào M3U.
       */
      if (ch.KodiProp) {
        m3u += normalizeKodiProp(ch.KodiProp);
      }

      /*
       * Nếu là DASH nhưng không có KodiProp,
       * thêm cấu hình InputStream Adaptive cơ bản.
       */
      else if (url.toLowerCase().includes(".mpd")) {
        m3u += "#KODIPROP:inputstreamaddon=inputstream.adaptive\n";
        m3u += "#KODIPROP:inputstream.adaptive.manifest_type=dash\n";
        m3u += "#KODIPROP:inputstream.adaptive.license_type=clearkey\n";
        m3u += "#KODIPROP:inputstream.adaptive.license_key=\n";
      }

      m3u += `${url}\n`;
    }

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "s-maxage=60, stale-while-revalidate=300"
    );

    res.status(200).send(m3u);

  } catch (error) {
    res.status(500).send(
      `Error: ${error.message}`
    );
  }
}

function normalizeKodiProp(value) {
  if (Array.isArray(value)) {
    return value.join("\n") + "\n";
  }

  return String(value).trim() + "\n";
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}
