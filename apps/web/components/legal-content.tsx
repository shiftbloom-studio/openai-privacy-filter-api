import { ReactNode } from "react";

import { operator } from "@/lib/operator";
import { getFilterRuntime } from "@/lib/runtime-config";

type Lang = "en" | "de";
type Section = { title: string; body: ReactNode };

const REPO_URL = "https://github.com/shiftbloom-studio/openai-privacy-filter-api";
const LAST_UPDATED = { en: "November 25, 2026", de: "25. November 2026" };

function NotConfigured({ lang }: { lang: Lang }): ReactNode {
  return <em>{lang === "de" ? "nicht konfiguriert" : "not configured"}</em>;
}

function Email({ lang }: { lang: Lang }): ReactNode {
  return operator.email ? (
    <a href={`mailto:${operator.email}`}>{operator.email}</a>
  ) : (
    <NotConfigured lang={lang} />
  );
}

function OperatorBlock({ lang }: { lang: Lang }): ReactNode {
  return (
    <p>
      {operator.name}
      {operator.representative ? (
        <>
          <br />
          {lang === "de" ? "Vertreten durch " : "Represented by "}
          {operator.representative}
        </>
      ) : null}
      {operator.address.map((line) => (
        <span key={line}>
          <br />
          {line}
        </span>
      ))}
      <br />
      {lang === "de" ? "E-Mail: " : "Email: "}
      <Email lang={lang} />
    </p>
  );
}

export function impressumSections(lang: Lang): Section[] {
  const de = lang === "de";
  return [
    {
      title: de ? "Angaben gemäß § 5 DDG" : "Information according to § 5 DDG",
      body: <OperatorBlock lang={lang} />
    },
    {
      title: de
        ? "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV"
        : "Responsible for content according to § 18 (2) MStV",
      body: <p>{operator.representative ?? operator.name}</p>
    },
    {
      title: de ? "Quellcode" : "Source code",
      body: (
        <p>
          {de
            ? "Dieses Projekt ist Open Source. Der Code liegt unter "
            : "This project is open source. The code lives at "}
          <a href={REPO_URL}>github.com/shiftbloom-studio/openai-privacy-filter-api</a>.
        </p>
      )
    },
    {
      title: de ? "Streitbeilegung" : "Dispute resolution",
      body: (
        <p>
          {de
            ? "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
            : "We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board."}
        </p>
      )
    }
  ];
}

export function privacySections(lang: Lang): Section[] {
  const de = lang === "de";
  const server = getFilterRuntime() === "server";

  const processing: Section = server
    ? {
        title: de ? "Verarbeitung deiner Texte" : "How your text is processed",
        body: (
          <p>
            {de
              ? "In dieser Installation läuft das Modell auf einem Server. Wenn du Text filterst, schickt dein Browser ihn an die Route /api/filter, die ihn an den Filter-Dienst des Betreibers weiterreicht und das Ergebnis zurückgibt. Der Anwendungscode speichert eingegebenen Text nicht."
              : "In this installation the model runs on a server. When you filter text, your browser sends it to the /api/filter route, which forwards it to the operator's filter service and returns the result. The application code does not store submitted text."}
          </p>
        )
      }
    : {
        title: de ? "Verarbeitung deiner Texte" : "How your text is processed",
        body: (
          <p>
            {de
              ? "Das Modell läuft vollständig in deinem Browser (WebGPU oder WebAssembly). Der Text, den du eingibst, verlässt dein Gerät nicht und wird weder an uns noch an Dritte übertragen."
              : "The model runs entirely in your browser (WebGPU or WebAssembly). The text you enter never leaves your device and is not sent to us or to anyone else."}
          </p>
        )
      };

  return [
    {
      title: de ? "Verantwortlicher" : "Controller",
      body: <OperatorBlock lang={lang} />
    },
    processing,
    {
      title: "Hosting",
      body: (
        <p>
          {de
            ? "Diese Seite wird über Cloudflare, Inc. (101 Townsend St, San Francisco, CA 94107, USA) ausgeliefert. Beim Aufruf verarbeitet Cloudflare technisch notwendige Daten wie IP-Adresse, Zeitpunkt, angefragte URL und User-Agent, um die Seite auszuliefern und vor Angriffen zu schützen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren, stabilen Betrieb). Cloudflare ist unter dem EU-US Data Privacy Framework zertifiziert."
            : "This site is served through Cloudflare, Inc. (101 Townsend St, San Francisco, CA 94107, USA). When you open it, Cloudflare processes technically necessary data such as your IP address, the time, the requested URL and your user agent to deliver the site and protect it from attacks. The legal basis is Art. 6(1)(f) GDPR (legitimate interest in secure, stable operation). Cloudflare is certified under the EU-US Data Privacy Framework."}
        </p>
      )
    },
    {
      title: de ? "Modell-Download (nur nach Zustimmung)" : "Model download (only after you agree)",
      body: (
        <p>
          {de
            ? "Erst wenn du zustimmst, lädt dein Browser die Modellgewichte (rund 900 MB) von Hugging Face (Hugging Face, Inc., USA, huggingface.co) und die ONNX-Runtime von jsDelivr (cdn.jsdelivr.net). Diese Anbieter erhalten dabei deine IP-Adresse und übliche Anfragedaten, aber keinen Text. Die Dateien bleiben im Cache deines Browsers, damit sie nicht erneut geladen werden müssen. Rechtsgrundlage ist deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG. Du kannst sie jederzeit widerrufen, indem du die Website-Daten in deinem Browser löschst."
            : "Only after you agree does your browser download the model weights (about 900 MB) from Hugging Face (Hugging Face, Inc., USA, huggingface.co) and the ONNX runtime from jsDelivr (cdn.jsdelivr.net). These providers receive your IP address and ordinary request data, but never your text. The files stay in your browser cache so they do not have to be downloaded again. The legal basis is your consent under Art. 6(1)(a) GDPR and § 25(1) TDDDG. You can withdraw it at any time by clearing this site's data in your browser."}
        </p>
      )
    },
    {
      title: de ? "Cookies, lokaler Speicher und Analyse" : "Cookies, local storage and analytics",
      body: (
        <p>
          {de
            ? "Wir setzen keine Cookies und nutzen kein Tracking und keine Analyse-Tools. Im lokalen Speicher deines Browsers merken wir uns nur, dass du dem Modell-Download zugestimmt hast."
            : "We set no cookies and use no tracking or analytics. Your browser's local storage only remembers that you agreed to the model download."}
        </p>
      )
    },
    {
      title: de ? "Deine Rechte" : "Your rights",
      body: (
        <p>
          {de
            ? "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Schreib uns dazu an "
            : "You have the right to access, rectification, erasure, restriction of processing, data portability and objection, and the right to lodge a complaint with a data protection supervisory authority. To exercise them, email "}
          <Email lang={lang} />.
          {operator.authority ? (
            <>
              {" "}
              {de ? "Zuständige Aufsichtsbehörde: " : "Competent supervisory authority: "}
              {operator.authority}.
            </>
          ) : null}
        </p>
      )
    },
    {
      title: de ? "Stand" : "Last updated",
      body: <p>{LAST_UPDATED[lang]}</p>
    }
  ];
}
