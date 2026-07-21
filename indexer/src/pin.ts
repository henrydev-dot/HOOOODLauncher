/**
 * IPFS pinning service — STUB.
 *
 * Token metadata (name, description, image, socials) is pinned to IPFS via
 * Pinata before `TokenFactory.createToken` is called with the resulting
 * `ipfs://` metadataURI. This module is a thin wrapper around Pinata's HTTP
 * API so the web app (or a small upload endpoint colocated with this indexer)
 * can pin without shipping the JWT to the browser.
 *
 * Status: NOT WIRED UP. The functions below are typed and documented, and
 * `pinJson` contains a working fetch-based implementation, but nothing in the
 * indexer calls it yet and there is no upload HTTP endpoint. See README
 * ("Stubbed features") for the follow-up plan.
 */

const PINATA_API_URL = "https://api.pinata.cloud";

export interface PinResult {
  /** The IPFS CID of the pinned content. */
  cid: string;
  /** Convenience `ipfs://` URI for storing on-chain. */
  uri: string;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  description?: string;
  image?: string; // ipfs:// or https:// URI
  website?: string;
  twitter?: string;
  telegram?: string;
}

const getJwt = (): string => {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error(
      "PINATA_JWT is not set. IPFS pinning is stubbed — see indexer/README.md.",
    );
  }
  return jwt;
};

/** Pin a JSON blob (token metadata) to IPFS via Pinata. */
export async function pinJson(
  content: TokenMetadata | Record<string, unknown>,
  name = "hoodiepad-metadata",
): Promise<PinResult> {
  const res = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getJwt()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataMetadata: { name },
      pinataContent: content,
    }),
  });

  if (!res.ok) {
    throw new Error(`Pinata pinJSONToIPFS failed: ${res.status} ${await res.text()}`);
  }

  const body = (await res.json()) as { IpfsHash: string };
  return { cid: body.IpfsHash, uri: `ipfs://${body.IpfsHash}` };
}

/** Pin a file (token image) to IPFS via Pinata. STUB — not implemented. */
export async function pinFile(_file: Blob, _name?: string): Promise<PinResult> {
  getJwt(); // fail fast with the same helpful error when unconfigured
  throw new Error("pinFile is stubbed — implement multipart upload to Pinata.");
}
