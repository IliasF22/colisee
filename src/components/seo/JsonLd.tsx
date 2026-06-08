/** Injecte un bloc JSON-LD (données structurées) dans la page. Server component. */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify échappe les caractères dangereux ; on neutralise aussi "<".
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
