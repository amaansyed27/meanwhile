const MAX_SLUG_LENGTH = 80;

export function cleanText(value: string, maxLength: number) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) {
    throw new Error("Required field is empty");
  }
  if (cleaned.length > maxLength) {
    throw new Error(`Value must be ${maxLength} characters or fewer`);
  }
  return cleaned;
}

export function cleanOptionalText(value: string | undefined, maxLength: number) {
  if (value === undefined) {
    return undefined;
  }
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) {
    return undefined;
  }
  if (cleaned.length > maxLength) {
    throw new Error(`Value must be ${maxLength} characters or fewer`);
  }
  return cleaned;
}

export function cleanMessage(value: string) {
  const cleaned = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (cleaned.length === 0) {
    throw new Error("Message is empty");
  }
  if (cleaned.length > 4000) {
    throw new Error("Message must be 4000 characters or fewer");
  }
  return cleaned;
}

export function normalizeUrl(value: string | undefined) {
  const cleaned = cleanOptionalText(value, 2048);
  if (!cleaned) {
    return undefined;
  }

  let url: URL;
  try {
    url = new URL(cleaned);
  } catch {
    throw new Error("Link must be a valid URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https links are allowed");
  }

  return url.toString();
}

export function makeSlug(title: string) {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return slug || "thread";
}

export function searchText(...parts: Array<string | undefined>) {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
