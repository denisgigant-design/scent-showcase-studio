import { useSite } from "@/components/site/store";

export function Ending() {
  const { apiRef } = useSite();
  return (
    <section className="ending">
      <div className="eyebrow">A study in feeling</div>
      <h2>
        Some things are
        <br />
        <i>better felt.</i>
      </h2>
      <p>
        Explore every note, catch the light against the glass, and find the fragrance that stays with you long after the moment ends.
      </p>
      <button
        id="returnBtn"
        onClick={() => {
          apiRef.current?.go("gallery");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        Return to the collection &nbsp; ↗
      </button>
      <div className="copyright">
        <span>© UNVEILED FINEST — A CONCEPT SHOWROOM</span>
        <span>
          CRAFTED WITH{" "}
          <a href="https://lovable.dev" target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
            LOVABLE
          </a>
        </span>
      </div>
    </section>
  );
}
