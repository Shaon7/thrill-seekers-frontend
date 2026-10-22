import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as pdfjsLib from "pdfjs-dist";

// This file is imported by the client-side matches page. Configure PDF.js's
// worker here because PDF rendering is performed by this utility.
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();
}

export interface FixtureDivision {
  name: string;
  divisionNumber: number;
  season: number;
  phase: number;
}

export interface FixtureMatch {
  matchId: string;
  homePlayerId: string;
  awayPlayerId: string;
  homeScore: number | null;
  awayScore: number | null;
  deadline: string;
  status?: string | null;
}

export interface FixturePlayer {
  name?: string;
}

interface DownloadRoundFixtureOptions {
  round: number;
  roundMatches: FixtureMatch[];
  division: FixtureDivision | null;
  getPlayer: (playerId: string) => FixturePlayer | null | undefined;
  formatDeadline: (deadline: string) => string;
  loadFixtureLogo: () => Promise<HTMLImageElement | null>;
}

export const downloadRoundFixture = async ({
  round,
  roundMatches,
  division,
  getPlayer,
  formatDeadline,
  loadFixtureLogo,
}: DownloadRoundFixtureOptions) => {
  if (
    !division ||
    roundMatches.length === 0
  ) {
    return;
  }

  let isIOSBrowser = false;
  let iosImageWindow: Window | null = null;

  try {
    // iOS browsers do not consistently support downloading PNGs from blob URLs.
    // Open a tab during the original click, then show the generated image there.
    isIOSBrowser =
      typeof navigator !== "undefined" &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" &&
          navigator.maxTouchPoints > 1));

    if (isIOSBrowser) {
      iosImageWindow = window.open("", "_blank");
      if (iosImageWindow) {
        iosImageWindow.document.title = "Preparing fixture image";
        iosImageWindow.document.body.textContent =
          "Preparing your fixture image...";
      }
    }

    // Use a custom page height based on the number of matches.
    // This keeps the entire round on one long page instead of
    // pushing the final matches onto a second PDF page.
    const pageWidthMm = 260;
    const tableStartY = 79;
    const estimatedHeaderHeight = 12;
    const estimatedRowHeight = 10;
    const footerAndBottomSpace = 35;

    const calculatedPageHeight = Math.ceil(
      tableStartY +
        estimatedHeaderHeight +
        roundMatches.length * estimatedRowHeight +
        footerAndBottomSpace,
    );

    const pageHeightMm = Math.max(205, calculatedPageHeight);

    const doc = new jsPDF({
      // Avoid jsPDF swapping custom dimensions when the dynamic page
      // height becomes taller than its width. The content stays 260 mm wide.
      orientation: pageWidthMm >= pageHeightMm ? "landscape" : "portrait",
      unit: "mm",
      format: [pageWidthMm, pageHeightMm],
    });

    const pageWidth =
      doc.internal.pageSize.getWidth();

    const pageHeight =
      doc.internal.pageSize.getHeight();

    const black: [number, number, number] = [
      18,
      18,
      18,
    ];

    const darkGray: [number, number, number] = [
      55,
      55,
      55,
    ];

    const gray: [number, number, number] = [
      115,
      115,
      115,
    ];

    const lightGray: [number, number, number] = [
      238,
      238,
      238,
    ];

    const softGray: [number, number, number] = [
      248,
      248,
      248,
    ];

    const accent: [number, number, number] = [
      205,
      25,
      75,
    ];

    const white: [number, number, number] = [
      255,
      255,
      255,
    ];

    const winnerGreen: [number, number, number] = [
      34,
      120,
      70,
    ];

    const winnerGreenSoft: [number, number, number] = [
      235,
      246,
      239,
    ];

    doc.setFillColor(
      ...white,
    );

    doc.rect(
      0,
      0,
      pageWidth,
      pageHeight,
      "F",
    );

    doc.setFillColor(
      ...accent,
    );

    doc.rect(
      0,
      0,
      pageWidth,
      4,
      "F",
    );

    doc.setFont(
      "helvetica",
      "bold",
    );

    doc.setFontSize(22);

    doc.setTextColor(
      ...black,
    );

    doc.text(
      "THRILL SEEKERS",
      10,
      18,
    );

    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(7.5);

    doc.setTextColor(
      ...gray,
    );

    doc.text(
      "EFOOTBALL CLUB",
      10,
      24,
    );

    doc.setFont(
      "helvetica",
      "bold",
    );

    doc.setFontSize(8);

    doc.setTextColor(
      ...accent,
    );

    doc.text(
      "MATCH FIXTURE",
      pageWidth - 10,
      17,
      {
        align: "right",
      },
    );

    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(7);

    doc.setTextColor(
      ...gray,
    );

    doc.text(
      `ROUND ${round}`,
      pageWidth - 10,
      23,
      {
        align: "right",
      },
    );

    doc.setDrawColor(
      ...lightGray,
    );

    doc.setLineWidth(0.5);

    doc.line(
      10,
      30,
      pageWidth - 10,
      30,
    );

    doc.setFont(
      "helvetica",
      "bold",
    );

    doc.setFontSize(15);

    doc.setTextColor(
      ...black,
    );

    doc.text(
      division.name ||
        `Division ${division.divisionNumber}`,
      10,
      41,
    );

    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(8);

    doc.setTextColor(
      ...gray,
    );

    doc.text(
      `Season ${division.season}-${division.season + 1}  •  Phase ${division.phase}`,
      10,
      47,
    );

    doc.setFillColor(
      ...accent,
    );

    doc.rect(
      10,
      51,
      34,
      1.5,
      "F",
    );

    const completedCount =
      roundMatches.filter(
        (match) =>
          match.status ===
          "COMPLETED",
      ).length;

    doc.setFillColor(
      ...softGray,
    );

    doc.roundedRect(
      10,
      56,
      pageWidth - 20,
      21,
      2.5,
      2.5,
      "F",
    );

    doc.setFillColor(
      ...accent,
    );

    doc.roundedRect(
      10,
      56,
      2,
      21,
      1,
      1,
      "F",
    );

    doc.setFont(
      "helvetica",
      "bold",
    );

    doc.setFontSize(11);

    doc.setTextColor(
      ...black,
    );

    doc.text(
      `ROUND ${round}`,
      18,
      66,
    );

    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(7.5);

    doc.setTextColor(
      ...gray,
    );

    doc.text(
      `Deadline: ${formatDeadline(
        roundMatches[0].deadline,
      )}`,
      58,
      66,
    );

    doc.setFont(
      "helvetica",
      "bold",
    );

    doc.setFontSize(7.5);

    doc.setTextColor(
      ...darkGray,
    );

    doc.text(
      `TOTAL MATCHES  ${roundMatches.length}`,
      pageWidth - 18,
      63,
      {
        align: "right",
      },
    );

    const summaryColor =
      completedCount ===
      roundMatches.length
        ? winnerGreen
        : darkGray;

    doc.setTextColor(
      ...summaryColor,
    );

    doc.text(
      `COMPLETED  ${completedCount}`,
      pageWidth - 18,
      70,
      {
        align: "right",
      },
    );

    const fixtureLogo =
      await loadFixtureLogo();

    const tableRows =
      roundMatches.map(
        (match, index) => {
          const homePlayer =
            getPlayer(
              match.homePlayerId,
            );

          const awayPlayer =
            getPlayer(
              match.awayPlayerId,
            );

          const homeName =
            homePlayer?.name ||
            match.homePlayerId;

          const awayName =
            awayPlayer?.name ||
            match.awayPlayerId;

          const isCompleted =
            match.status ===
            "COMPLETED";

          const hasScore =
            isCompleted &&
            match.homeScore !== null &&
            match.awayScore !== null;

          const homeWon =
            hasScore &&
            match.homeScore! >
              match.awayScore!;

          const awayWon =
            hasScore &&
            match.awayScore! >
              match.homeScore!;

          const formattedStatus =
            match.status
              ? match.status
                  .toLowerCase()
                  .replace(
                    /^./,
                    (letter) =>
                      letter.toUpperCase(),
                  )
              : "";

          return {
            row: [
              String(index + 1),

              match.matchId,

              homeName,

              hasScore
                ? String(
                    match.homeScore,
                  )
                : "",

              hasScore
                ? String(
                    match.awayScore,
                  )
                : "",

              awayName,

              formatDeadline(
                match.deadline,
              ),

              formattedStatus,
            ],

            homeWon,

            awayWon,

            isCompleted,

            status: (match.status ?? "").trim().toUpperCase(),
          };
        },
      );

    let homePlayerColumnCenterX: number | null = null;
    let awayPlayerColumnCenterX: number | null = null;

    autoTable(doc, {
      startY: tableStartY,

      margin: {
        left: 10,
        right: 10,
      },

      head: [
        [
          "#",
          "MATCH ID",
          "HOME",
          "H",
          "A",
          "AWAY",
          "DEADLINE",
          "STATUS",
        ],
      ],

      body: tableRows.map(
        (item) => item.row,
      ),

      theme: "plain",

      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 2.5,
        valign: "middle",
        lineWidth: 0.2,
        lineColor:
          lightGray,
        textColor:
          black,
        fillColor:
          false,
        overflow:
          "ellipsize",
        minCellHeight:
          8.5,
      },

      headStyles: {
        fontStyle:
          "bold",
        fontSize: 8,
        textColor:
          white,
        fillColor:
          false,
        halign:
          "center",
        valign:
          "middle",
        cellPadding: 3,
      },

      columnStyles: {
        0: {
          cellWidth: 10,
          halign:
            "center",
          fontStyle:
            "bold",
        },

        1: {
          cellWidth: 28,
          fontStyle:
            "bold",
        },

        2: {
          cellWidth: 48,
          fontSize: 8.0,
          fontStyle:
            "bold",
          halign:
            "right",
          overflow:
            "ellipsize",
        },

        3: {
          cellWidth: 9,
          halign:
            "right",
          fontStyle:
            "bold",
        },

        4: {
          cellWidth: 9,
          halign:
            "left",
          fontStyle:
            "bold",
        },

        5: {
          cellWidth: 48,
          fontSize: 8.0,
          fontStyle:
            "bold",
          halign:
            "left",
          overflow:
            "ellipsize",
        },

        6: {
          cellWidth: 56,
          halign:
            "center",
        },

        7: {
          cellWidth: 38,
          halign:
            "center",
          fontStyle:
            "bold",
          overflow:
            "ellipsize",
        },
      },

      willDrawCell:
        (data) => {
          if (
            data.section ===
            "head"
          ) {
            doc.setFillColor(
              ...black,
            );

            doc.roundedRect(
              data.cell.x +
                0.5,
              data.cell.y +
                0.8,
              data.cell.width -
                1,
              data.cell.height -
                1.6,
              1.5,
              1.5,
              "F",
            );

            return;
          }

          if (
            data.section === "body" &&
            data.column.index === 2
          ) {
            homePlayerColumnCenterX =
              data.cell.x + data.cell.width / 2;
          }

          if (
            data.section === "body" &&
            data.column.index === 5
          ) {
            awayPlayerColumnCenterX =
              data.cell.x + data.cell.width / 2;
          }

          const rowInfo =
            tableRows[
              data.row.index
            ];

          if (
            data.section ===
              "body" &&
            data.column.index ===
              0
          ) {
            const tableLeft = 10;

            const tableWidth =
              pageWidth - 20;

            doc.setFillColor(
              data.row.index %
                2 ===
                0
                ? 248
                : 255,
              data.row.index %
                2 ===
                0
                ? 248
                : 255,
              data.row.index %
                2 ===
                0
                ? 248
                : 255,
            );

            doc.saveGraphicsState();
            doc.setGState(
              doc.GState({
                opacity: 0.65,
              }),
            );

            doc.roundedRect(
              tableLeft,
              data.cell.y +
                0.5,
              tableWidth,
              data.row.height -
                1,
              2,
              2,
              "F",
            );

            doc.restoreGraphicsState();

            doc.setDrawColor(
              ...lightGray,
            );

            doc.setLineWidth(
              0.25,
            );

            doc.line(
              tableLeft + 2,
              data.cell.y +
                data.row.height,
              tableLeft +
                tableWidth -
                2,
              data.cell.y +
                data.row.height,
            );
          }

          if (
            data.section ===
              "body" &&
            data.column.index ===
              0
          ) {
            doc.setFillColor(
              ...black,
            );

            doc.roundedRect(
              data.cell.x +
                1.5,
              data.cell.y + 2,
              data.cell.width -
                3,
              data.cell.height -
                4,
              1.5,
              1.5,
              "F",
            );

            data.cell.styles.textColor =
              white;
          }

          if (
            rowInfo?.homeWon &&
            data.section ===
              "body" &&
            (
              data.column.index ===
                2 ||
              data.column.index ===
                3
            )
          ) {
            doc.setFillColor(
              ...winnerGreenSoft,
            );

            doc.roundedRect(
              data.cell.x + 1,
              data.cell.y + 1,
              data.cell.width -
                2,
              data.cell.height -
                2,
              1.5,
              1.5,
              "F",
            );
          }

          if (
            rowInfo?.awayWon &&
            data.section ===
              "body" &&
            (
              data.column.index ===
                4 ||
              data.column.index ===
                5
            )
          ) {
            doc.setFillColor(
              ...winnerGreenSoft,
            );

            doc.roundedRect(
              data.cell.x + 1,
              data.cell.y + 1,
              data.cell.width -
                2,
              data.cell.height -
                2,
              1.5,
              1.5,
              "F",
            );
          }
        },

      didParseCell:
        (data) => {
          const rowInfo =
            tableRows[
              data.row.index
            ];

          if (
            data.section ===
              "body" &&
            data.column.index ===
              1
          ) {
            data.cell.styles.textColor =
              accent;
          }

          if (
            rowInfo?.homeWon &&
            data.section ===
              "body" &&
            (
              data.column.index ===
                2 ||
              data.column.index ===
                3
            )
          ) {
            data.cell.styles.textColor =
              winnerGreen;

            data.cell.styles.fontStyle =
              "bold";
          }

          if (
            rowInfo?.awayWon &&
            data.section ===
              "body" &&
            (
              data.column.index ===
                4 ||
              data.column.index ===
                5
            )
          ) {
            data.cell.styles.textColor =
              winnerGreen;

            data.cell.styles.fontStyle =
              "bold";
          }

          if (
            data.section ===
              "body" &&
            (
              data.column.index ===
                3 ||
              data.column.index ===
                4
            )
          ) {
            data.cell.styles.fontSize =
              9.5;

            data.cell.styles.fontStyle =
              "bold";
          }

          if (
            data.section === "body" &&
            data.column.index === 7
          ) {
            const status = rowInfo?.status;

            data.cell.styles.fontStyle = "bold";
            data.cell.styles.halign = "center";

            // Color only the STATUS cell; leave the rest of each match row unchanged.
            if (status === "SCHEDULED" || status === "RESCHEDULED") {
              data.cell.styles.fillColor = [255, 237, 213];
              data.cell.styles.textColor = [194, 65, 12];
            } else if (status === "COMPLETED") {
              data.cell.styles.fillColor = [220, 252, 231];
              data.cell.styles.textColor = [22, 101, 52];
            } else if (status === "CANCELLED") {
              data.cell.styles.fillColor = [254, 226, 226];
              data.cell.styles.textColor = [185, 28, 28];
            } else {
              data.cell.styles.textColor = black;
              data.cell.styles.fontStyle = "normal";
            }
          }
        },
    });

    // Draw the logo as a subtle watermark, dynamically centered over
    // the actual table area. Its size grows with the rendered table,
    // but is capped so it never dominates the fixture rows.
    if (fixtureLogo) {
      const tableFinalY =
        (doc as any).lastAutoTable?.finalY ??
        tableStartY + estimatedHeaderHeight +
          roundMatches.length * estimatedRowHeight;

      const tableAreaHeight = Math.max(
        1,
        tableFinalY - tableStartY,
      );

      const logoSize = Math.min(
        72,
        tableAreaHeight * 0.82,
      );

      // Center the watermark between the HOME and AWAY player columns,
      // rather than at the center of the entire page.
      const logoCenterX =
        homePlayerColumnCenterX !== null &&
        awayPlayerColumnCenterX !== null
          ? (homePlayerColumnCenterX + awayPlayerColumnCenterX) / 2
          : pageWidth / 2;

      const logoX =
        logoCenterX - logoSize / 2;

      const logoY =
        tableStartY +
        (tableAreaHeight - logoSize) / 2;

      doc.saveGraphicsState();
      doc.setGState(
        doc.GState({
          opacity: 0.11,
        }),
      );

      doc.addImage(
        fixtureLogo,
        "PNG",
        logoX,
        logoY,
        logoSize,
        logoSize,
      );

      doc.restoreGraphicsState();
    }

    const pageCount =
      doc.getNumberOfPages();

    for (
      let page = 1;
      page <= pageCount;
      page++
    ) {
      doc.setPage(page);

      doc.setDrawColor(
        ...lightGray,
      );

      doc.setLineWidth(
        0.35,
      );

      doc.line(
        10,
        pageHeight - 20,
        pageWidth - 10,
        pageHeight - 20,
      );

      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.setFontSize(7);

      doc.setTextColor(
        ...black,
      );

      doc.text(
        "THRILL SEEKERS",
        10,
        pageHeight - 14,
      );

      doc.setFont(
        "helvetica",
        "normal",
      );

      doc.setTextColor(
        ...gray,
      );

      doc.text(
        `Efootball Club  •  Round ${round}`,
        pageWidth / 2,
        pageHeight - 14,
        {
          align: "center",
        },
      );

      doc.text(
        `Completed ${completedCount}/${roundMatches.length}`,
        pageWidth - 10,
        pageHeight - 14,
        {
          align: "right",
        },
      );

      doc.setFillColor(
        ...accent,
      );

      doc.rect(
        10,
        pageHeight - 8,
        pageWidth - 20,
        1,
        "F",
      );
    }

    const safeDivisionName =
      (
        division.name ||
        `Division-${division.divisionNumber}`
      )
        .replace(
          /[^a-z0-9]+/gi,
          "-",
        )
        .replace(
          /^-+|-+$/g,
          "",
        );

    const pdfData =
      doc.output(
        "arraybuffer",
      );

    const pdf =
      await pdfjsLib
        .getDocument({
          data: pdfData,
        })
        .promise;

    const renderScale = 3;

    const renderedPages:
      HTMLCanvasElement[] =
      [];

    let totalHeight = 0;

    let maxWidth = 0;

    for (
      let pageNumber = 1;
      pageNumber <=
      pdf.numPages;
      pageNumber++
    ) {
      const page =
        await pdf.getPage(
          pageNumber,
        );

      const viewport =
        page.getViewport({
          scale: renderScale,
        });

      const canvas =
        document.createElement(
          "canvas",
        );

      const context =
        canvas.getContext(
          "2d",
        );

      if (!context) {
        throw new Error(
          "Unable to create canvas.",
        );
      }

      canvas.width =
        Math.ceil(
          viewport.width,
        );

      canvas.height =
        Math.ceil(
          viewport.height,
        );

      await page.render({
        canvas,
        canvasContext:
          context,
        viewport,
      }).promise;

      renderedPages.push(
        canvas,
      );

      totalHeight +=
        canvas.height;

      maxWidth = Math.max(
        maxWidth,
        canvas.width,
      );
    }

    const finalCanvas =
      document.createElement(
        "canvas",
      );

    finalCanvas.width =
      maxWidth;

    finalCanvas.height =
      totalHeight;

    const finalContext =
      finalCanvas.getContext(
        "2d",
      );

    if (!finalContext) {
      throw new Error(
        "Unable to create final canvas.",
      );
    }

    finalContext.fillStyle =
      "white";

    finalContext.fillRect(
      0,
      0,
      finalCanvas.width,
      finalCanvas.height,
    );

    let currentY = 0;

    for (
      const pageCanvas of renderedPages
    ) {
      finalContext.drawImage(
        pageCanvas,
        0,
        currentY,
      );

      currentY +=
        pageCanvas.height;
    }

    const imageBlob =
      await new Promise<Blob | null>(
        (resolve) => {
          finalCanvas.toBlob(
            (blob) =>
              resolve(blob),
            "image/png",
            1,
          );
        },
      );

    if (!imageBlob) {
      throw new Error(
        "Failed to create fixture image.",
      );
    }

    const imageUrl =
      URL.createObjectURL(
        imageBlob,
      );

    const fileName =
      `${safeDivisionName}-Round-${round}-Fixture.png`;

    if (isIOSBrowser) {
      // iOS Chrome may ignore the anchor's download attribute for blob URLs.
      // Show the image in a tab so the user can press and hold it to save it.
      if (iosImageWindow && !iosImageWindow.closed) {
        iosImageWindow.location.replace(imageUrl);
        // Keep the image URL alive long enough for the user to save the image.
        window.setTimeout(
          () => URL.revokeObjectURL(imageUrl),
          10 * 60 * 1000,
        );
      } else {
        // If a new tab was blocked, show the image in the current tab instead.
        window.location.assign(imageUrl);
      }

      return;
    }

    const link =
      document.createElement(
        "a",
      );

    link.href =
      imageUrl;

    link.download =
      fileName;

    document.body.appendChild(
      link,
    );

    link.click();

    document.body.removeChild(
      link,
    );

    // Do not revoke the blob URL immediately; some browsers need a short time
    // to start the download.
    window.setTimeout(
      () => URL.revokeObjectURL(imageUrl),
      60_000,
    );
  } catch (error) {
    if (iosImageWindow && !iosImageWindow.closed) {
      iosImageWindow.close();
    }

    console.error(
      "Fixture image generation failed:",
      error,
    );
  }
};
