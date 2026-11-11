import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { type NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import React from "react";
import { CertificateDocument } from "@/components/certificate/CertificateDocument";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  segmentData: { params: Promise<{ attemptId: string }> },
) {
  try {
    const params = await segmentData.params;
    const { attemptId } = params;

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID is required." }, { status: 400 });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        user: true,
        score: true,
        certificate: true,
      },
    });

    if (!attempt?.score || !attempt.certificate) {
      return NextResponse.json(
        { error: "Certificate or score report not found." },
        { status: 404 },
      );
    }

    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "zylthara.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";
    const verificationUrl = `${protocol}://${host}/verify/${attempt.certificate.verificationCode}`;

    // Generate QR Code data URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 150,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    const formattedDate = attempt.finishedAt
      ? new Intl.DateTimeFormat("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(attempt.finishedAt))
      : new Intl.DateTimeFormat("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date());

    const pdfBuffer = await renderToBuffer(
      React.createElement(CertificateDocument, {
        data: {
          testTakerName: attempt.user.name,
          testDate: formattedDate,
          certificateNo: attempt.certificate.certificateNo,
          verificationCode: attempt.certificate.verificationCode,
          listeningScore: attempt.score.listeningScore,
          structureScore: attempt.score.structureScore,
          readingScore: attempt.score.readingScore,
          totalScore: attempt.score.totalScore,
          qrCodeDataUrl,
        },
      }) as unknown as React.ReactElement<DocumentProps>,
    );

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Zylthara-Certificate-${attempt.certificate.certificateNo}.pdf"`,
      },
    });
  } catch (err: unknown) {
    console.error("Certificate generation error:", err);
    return NextResponse.json({ error: "Failed to generate certificate PDF." }, { status: 500 });
  }
}
