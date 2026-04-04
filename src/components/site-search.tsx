"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStorefrontPublicState } from "@/lib/use-storefront-public-state";

export default function SiteSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const storefrontState = useStorefrontPublicState();
  const products = storefrontState.products;
  const currencySymbol = storefrontState.settings.currencySymbol;

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return products
      .filter((product) => product.isActive)
      .filter(
        (product) =>
          product.name.toLowerCase().includes(normalized) ||
          product.shortDescription.toLowerCase().includes(normalized) ||
          product.badge.toLowerCase().includes(normalized),
      )
      .slice(0, 5);
  }, [products, query]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim();
    router.push(normalized ? `/store?query=${encodeURIComponent(normalized)}` : "/store");
    setQuery("");
  }

  return (
    <div className="site-search">
      <form className="site-search__form" onSubmit={handleSubmit}>
        <input
          className="site-search__input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحثي عن منتج أو عطر"
        />
        <button className="site-search__button" type="submit">
          بحث
        </button>
      </form>
      {results.length > 0 ? (
        <div className="site-search__results">
          {results.map((product) => (
            <Link
              key={product.id}
              className="site-search__result"
              href={`/store/${product.id}`}
              onClick={() => setQuery("")}
            >
              <span className="site-search__result-name">{product.name}</span>
              <span className="site-search__result-meta">{product.categoryLabel} • {Math.round(product.price)} {currencySymbol}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
