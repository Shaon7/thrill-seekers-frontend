"use client";

import * as pdfjsLib from "pdfjs-dist";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();
}

import { useState } from "react";
import Navbar from "../components/Navbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Trophy,
} from "lucide-react";

type RuleItem = {
  number: number;
  title: string;
  description: string;
};

type RuleSection = {
  id: string;
  title: string;
  description: string;
  rules: RuleItem[];
};

const ruleSections: RuleSection[] = [
  {
    id: "match-result-rescheduling",
    title: "Match Result Submission & Rescheduling Rules",
    description:
      "Rules for result submission, opponent response, late submission and match rescheduling.",
    rules: [
      {
        number: 1,
        title: "Result Submission Deadline",
        description:
          "The match result must be submitted by Deadline + 30 minutes. This is the final time allowed for result submission.",
      },
      {
        number: 2,
        title: "Opponent Does Not Respond",
        description:
          "If a player mentions or challenges their opponent and the opponent does not respond before the deadline, the player who made the submission will receive an automatic win. The result must still be submitted within Deadline + 30 minutes.",
      },
      {
        number: 3,
        title: "No Response from Either Player",
        description:
          "If neither player responds or takes any action before the deadline, the match will be recorded as a draw.",
      },
      {
        number: 4,
        title: "No Result Submitted",
        description:
          "If no match result is submitted by Deadline + 30 minutes, the match will automatically be recorded as a draw.",
      },
      {
        number: 5,
        title: "Late Submission",
        description:
          "Results submitted after Deadline + 30 minutes will normally not be accepted. Exceptions may be made only with admin approval.",
      },
      {
        number: 6,
        title: "Match Rescheduling",
        description:
          "In case of a genuine emergency, a match may be rescheduled only if both players agree. The rescheduling request must be made before the original match deadline.",
      },
      {
        number: 7,
        title: "Rescheduled Match Deadline",
        description:
          "A rescheduled match must be completed within 72 hours after the original deadline.",
      },
      {
        number: 8,
        title: "Failure to Complete a Rescheduled Match",
        description:
          "If a rescheduled match is not completed within the additional 72-hour period: if both players fail to complete the match, it will be recorded as a draw. If one player was available and willing to play but the other player was not, the available player will receive an automatic win, subject to admin verification if necessary.",
      },
      {
        number: 9,
        title: "Rescheduling Limit",
        description:
          "Each player may reschedule a maximum of 5 matches per league.",
      },
      {
        number: 10,
        title: "Admin Decision",
        description:
          "In situations not covered by these rules, the league administrator has the final authority to determine the appropriate outcome.",
      },
    ],
  },
  {
    id: "payment",
    title: "Payment",
    description: "Payment rules and regulations will be added here.",
    rules: [],
  },
];

const BOLD_KEYWORDS = [
  "Deadline + 30 minutes",
  "automatic win",
  "draw",
  "72 hours",
  "72-hour",
  "5 matches",
  "admin approval",
  "admin verification",
  "final authority",
];

const loadFixtureLogo = (): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = "/icon.png";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
};

export default function RulesPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    ruleSections[0]?.id ?? null,
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSection((current) =>
      current === sectionId ? null : sectionId,
    );
  };

  const downloadSectionRules = async (section: RuleSection) => {
    if (section.rules.length === 0) {
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [270, 200],
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const black: [number, number, number] = [18, 18, 18];
      const darkGray: [number, number, number] = [55, 55, 55];
      const gray: [number, number, number] = [115, 115, 115];
      const lightGray: [number, number, number] = [238, 238, 238];
      const softGray: [number, number, number] = [248, 248, 248];
      const accent: [number, number, number] = [205, 25, 75];
      const white: [number, number, number] = [255, 255, 255];

      // Background
      doc.setFillColor(...white);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Top Accent Line
      doc.setFillColor(...accent);
      doc.rect(0, 0, pageWidth, 4, "F");

      // Header Left
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...black);
      doc.text("THRILL SEEKERS", 10, 17);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...gray);
      doc.text("EFOOTBALL CLUB", 10, 23);

      // Header Right
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...accent);
      doc.text("RULES & REGULATIONS", pageWidth - 10, 16, {
        align: "right",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...gray);
      doc.text("OFFICIAL CLUB RULES", pageWidth - 10, 22, {
        align: "right",
      });

      // Top Divider
      doc.setDrawColor(...lightGray);
      doc.setLineWidth(0.4);
      doc.line(10, 28, pageWidth - 10, 28);

      // Title & Description
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(...black);

      const titleLines = doc.splitTextToSize(section.title, pageWidth - 20);
      doc.text(titleLines, 10, 37);

      const titleLineCount = Array.isArray(titleLines)
        ? titleLines.length
        : 1;

      const detailsY = 37 + titleLineCount * 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...gray);

      const descriptionLines = doc.splitTextToSize(
        section.description,
        pageWidth - 20,
      );

      doc.text(descriptionLines, 10, detailsY);

      const descriptionLineCount = Array.isArray(descriptionLines)
        ? descriptionLines.length
        : 1;

      const tableStartY = detailsY + descriptionLineCount * 4 + 4;

      // Rule Count Badge
      doc.setFillColor(...softGray);
      doc.roundedRect(
        10,
        tableStartY - 4,
        pageWidth - 20,
        10,
        2,
        2,
        "F",
      );

      doc.setFillColor(...accent);
      doc.roundedRect(
        10,
        tableStartY - 4,
        2,
        10,
        1,
        1,
        "F",
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...darkGray);
      doc.text(
        `${section.rules.length} RULES`,
        17,
        tableStartY + 2,
      );

      const logo = await loadFixtureLogo();

      const tableRows = section.rules.map((rule) => [
        String(rule.number),
        rule.title,
        rule.description,
      ]);

      autoTable(doc, {
        startY: tableStartY + 9,
        margin: {
          left: 10,
          right: 10,
        },
        head: [["#", "RULE", "DETAILS"]],
        body: tableRows,
        theme: "plain",
        styles: {
          font: "helvetica",
          fontSize: 8.2,
          cellPadding: 2.6,
          valign: "middle",
          lineWidth: 0.2,
          lineColor: lightGray,
          textColor: black,
          fillColor: false,
          overflow: "linebreak",
          minCellHeight: 8.5,
        },
        headStyles: {
          fontStyle: "bold",
          fontSize: 8,
          textColor: white,
          fillColor: false,
          halign: "center",
          valign: "middle",
          cellPadding: 2.5,
        },
        columnStyles: {
          0: {
            cellWidth: 10,
            halign: "center",
            fontStyle: "bold",
          },
          1: {
            cellWidth: 55,
            fontStyle: "bold",
          },
          2: {
            cellWidth: 185,
            overflow: "linebreak",
          },
        },
            didDrawPage: (data) => {
  if (!logo) {
    return;
  }

  doc.saveGraphicsState();

  doc.setGState(
    doc.GState({
      opacity: 0.08,
    }),
  );

  // 1. Column bounds calculation
  const tableMarginLeft = data.settings.margin.left ?? 10;
  const col0Width = data.table.columns[0]?.width ?? 10;
  const col1Width = data.table.columns[1]?.width ?? 55;
  const detailsColWidth = data.table.columns[2]?.width ?? 185;

  const detailsColX = tableMarginLeft + col0Width + col1Width;
  const logoSize = 80;

  // 2. Base centered coordinates
  const baseLogoX = detailsColX + detailsColWidth / 2 - logoSize / 2;
  const tableHeight = data.cursor?.y
    ? data.cursor.y - tableStartY
    : 120;
  const baseLogoY = tableStartY + tableHeight / 2 - logoSize / 2;

  // -------------------------------------------------------------
  // 3. MANUAL OFFSETS (Adjust these values in mm)
  // -------------------------------------------------------------
  const offsetX = -12; // Negative = Move Left, Positive = Move Right
  const offsetY = 7;   // Negative = Move Up,   Positive = Move Down

  const finalLogoX = baseLogoX + offsetX;
  const finalLogoY = baseLogoY + offsetY;

  doc.addImage(
    logo,
    "PNG",
    finalLogoX,
    finalLogoY,
    logoSize,
    logoSize,
  );

  doc.restoreGraphicsState();
},
        willDrawCell: (data) => {
          if (data.section === "head") {
            doc.setFillColor(...black);

            doc.roundedRect(
              data.cell.x + 0.5,
              data.cell.y + 0.5,
              data.cell.width - 1,
              data.cell.height - 1,
              1.2,
              1.2,
              "F",
            );

            return;
          }

          if (
            data.section === "body" &&
            data.column.index === 0
          ) {
            doc.setFillColor(
              data.row.index % 2 === 0 ? 248 : 255,
              data.row.index % 2 === 0 ? 248 : 255,
              data.row.index % 2 === 0 ? 248 : 255,
            );

            doc.roundedRect(
              10,
              data.cell.y + 0.3,
              pageWidth - 20,
              data.row.height - 0.6,
              1.5,
              1.5,
              "F",
            );

            doc.setDrawColor(...lightGray);
            doc.setLineWidth(0.2);

            doc.line(
              12,
              data.cell.y + data.row.height,
              pageWidth - 12,
              data.cell.y + data.row.height,
            );

            doc.setFillColor(...black);

            doc.roundedRect(
              data.cell.x + 1,
              data.cell.y + 1.2,
              data.cell.width - 2,
              data.cell.height - 2.4,
              1.2,
              1.2,
              "F",
            );

            data.cell.styles.textColor = white;
          }
        },
        didDrawCell: (data) => {
          // Custom render for Details Column to bold key phrases
          if (data.section === "body" && data.column.index === 2) {
            const rawText = data.cell.raw as string;
            if (!rawText) return;

            // Clear standard text output inside the cell
            doc.setFillColor(
              data.row.index % 2 === 0 ? 248 : 255,
              data.row.index % 2 === 0 ? 248 : 255,
              data.row.index % 2 === 0 ? 248 : 255,
            );

            doc.rect(
              data.cell.x + 0.5,
              data.cell.y + 0.5,
              data.cell.width - 1,
              data.cell.height - 1,
              "F",
            );

            doc.setFontSize(8.2);
            doc.setTextColor(...black);

            const startX = data.cell.x + 2.6;
            let currentY = data.cell.y + 4.8;
            const maxWidth = data.cell.width - 5.2;

            // Split into lines based on available width
            doc.setFont("helvetica", "normal");
            const words = rawText.split(" ");
            let currentLine = "";
            const lines: string[] = [];

            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              if (doc.getTextWidth(testLine) > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) lines.push(currentLine);

            // Center vertical alignment
            const totalTextHeight = lines.length * 3.6;
            if (data.cell.height > totalTextHeight) {
              currentY =
                data.cell.y + (data.cell.height - totalTextHeight) / 2 + 3;
            }

            // Draw line by line with word-level bolding
            for (const line of lines) {
              let cursorX = startX;
              const lineWords = line.split(" ");

              let i = 0;
              while (i < lineWords.length) {
                let matchedPhrase = "";
                let isMatch = false;

                // Check phrase matches against keywords
                for (const keyword of BOLD_KEYWORDS) {
                  const keywordWords = keyword.split(" ");
                  const phraseSlice = lineWords
                    .slice(i, i + keywordWords.length)
                    .join(" ")
                    .replace(/[,.]/g, "");

                  if (
                    phraseSlice.toLowerCase() === keyword.toLowerCase()
                  ) {
                    matchedPhrase = lineWords
                      .slice(i, i + keywordWords.length)
                      .join(" ");
                    isMatch = true;
                    i += keywordWords.length;
                    break;
                  }
                }

                if (isMatch) {
                  doc.setFont("helvetica", "bold");
                  doc.text(matchedPhrase + " ", cursorX, currentY);
                  cursorX += doc.getTextWidth(matchedPhrase + " ");
                } else {
                  doc.setFont("helvetica", "normal");
                  const word = lineWords[i] + " ";
                  doc.text(word, cursorX, currentY);
                  cursorX += doc.getTextWidth(word);
                  i++;
                }
              }
              currentY += 3.6;
            }
          }
        },
        didParseCell: (data) => {
          if (
            data.section === "body" &&
            data.column.index === 1
          ) {
            data.cell.styles.textColor = accent;
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      const pageCount = doc.getNumberOfPages();

      for (
        let pageNumber = 1;
        pageNumber <= pageCount;
        pageNumber++
      ) {
        doc.setPage(pageNumber);

        doc.setDrawColor(...lightGray);
        doc.setLineWidth(0.3);

        doc.line(
          10,
          pageHeight - 14,
          pageWidth - 10,
          pageHeight - 14,
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...black);
        doc.text("THRILL SEEKERS", 10, pageHeight - 9);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...gray);
        doc.text(
          "Efootball Club",
          pageWidth / 2,
          pageHeight - 9,
          {
            align: "center",
          },
        );

        doc.text(
          `Page ${pageNumber}/${pageCount}`,
          pageWidth - 10,
          pageHeight - 9,
          {
            align: "right",
          },
        );

        doc.setFillColor(...accent);
        doc.rect(
          10,
          pageHeight - 4,
          pageWidth - 20,
          1,
          "F",
        );
      }

      const safeSectionName = section.title
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "");

      const pdfData = doc.output("arraybuffer");

      const pdf = await pdfjsLib.getDocument({
        data: pdfData,
      }).promise;

      const renderScale = 3;
      const renderedPages: HTMLCanvasElement[] = [];
      let totalHeight = 0;
      let maxWidth = 0;

      for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
      ) {
        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({
          scale: renderScale,
        });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Unable to create canvas.");
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        renderedPages.push(canvas);
        totalHeight += canvas.height;
        maxWidth = Math.max(maxWidth, canvas.width);
      }

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = maxWidth;
      finalCanvas.height = totalHeight;

      const finalContext = finalCanvas.getContext("2d");

      if (!finalContext) {
        throw new Error("Unable to create final canvas.");
      }

      finalContext.fillStyle = "white";
      finalContext.fillRect(
        0,
        0,
        finalCanvas.width,
        finalCanvas.height,
      );

      let currentY = 0;

      for (const pageCanvas of renderedPages) {
        finalContext.drawImage(
          pageCanvas,
          0,
          currentY,
        );

        currentY += pageCanvas.height;
      }

      const imageBlob = await new Promise<Blob | null>(
        (resolve) => {
          finalCanvas.toBlob(
            (blob) => resolve(blob),
            "image/png",
            1,
          );
        },
      );

      if (!imageBlob) {
        throw new Error("Failed to create rules image.");
      }

      const imageUrl = URL.createObjectURL(imageBlob);
      const link = document.createElement("a");

      link.href = imageUrl;
      link.download = `${safeSectionName}-Rules.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error(
        "Rules image generation failed:",
        error,
      );

      alert("Failed to download the rules image.");
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-yellow-400">
                <Trophy size={20} />

                <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                  Thrill Seekers
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Rules & Regulations
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Official league rules for match results, rescheduling and future club sections.
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-5">
          {ruleSections.map((section) => {
            const isExpanded = expandedSection === section.id;
            const hasRules = section.rules.length > 0;

            return (
              <section
                key={section.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
                            <FileText size={20} />
                          </div>

                          <div className="min-w-0">
                            <h2 className="text-lg font-bold sm:text-xl">
                              {section.title}
                            </h2>

                            <p className="mt-1 text-xs leading-5 text-zinc-500 sm:text-sm">
                              {section.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 rounded-xl border border-white/10 p-2 text-zinc-400">
                          {isExpanded ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    title={
                      hasRules
                        ? "Download rules"
                        : "No rules to download"
                    }
                    aria-label={
                      hasRules
                        ? "Download rules"
                        : "No rules to download"
                    }
                    disabled={!hasRules}
                    onClick={(event) => {
                      event.stopPropagation();
                      void downloadSectionRules(section);
                    }}
                    className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-400 transition hover:border-yellow-400/20 hover:bg-yellow-400/10 hover:text-yellow-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Download size={15} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-4 sm:p-6">
                    {hasRules ? (
                      <div className="space-y-3">
                        {section.rules.map((rule) => (
                          <article
                            key={rule.number}
                            className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5"
                          >
                            <div className="flex gap-4">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-sm font-black text-yellow-400">
                                {rule.number}
                              </div>

                              <div className="min-w-0">
                                <h3 className="text-sm font-bold text-white sm:text-base">
                                  {rule.title}
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-zinc-400">
                                  {rule.description}
                                </p>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-black/20 py-12 text-center">
                        <FileText
                          size={26}
                          className="mx-auto text-zinc-600"
                        />

                        <p className="mt-3 text-sm font-medium text-zinc-400">
                          No rules added yet
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          Payment rules will be added to this section later.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}