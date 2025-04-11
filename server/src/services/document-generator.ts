import { db } from "@/db";
import { documents, leases } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import PDFDocument from "pdfkit";

export async function generateLeaseAgreement(leaseId: string): Promise<string> {
  // Fetch lease data with all related information
  const lease = await db.query.leases.findFirst({
    where: eq(leases.id, leaseId),
    with: {
      tenant: true,
      unit: {
        with: {
          property: true,
        },
      },
    },
  });

  if (!lease) {
    throw new Error(`Lease with ID ${leaseId} not found`);
  }

  // Create PDF
  const doc = new PDFDocument();
  const filename = `lease_${leaseId}_${Date.now()}.pdf`;
  const path = `./uploads/documents/${filename}`;

  // Pipe output to file
  doc.pipe(fs.createWriteStream(path));

  // Add content
  doc.fontSize(25).text("LEASE AGREEMENT", { align: "center" });
  // ... add more content based on lease data

  doc.end();

  // Save reference in documents table
  await db.insert(documents).values({
    name: `Lease Agreement - ${lease.tenant.name}`,
    type: "lease",
    url: path,
    relatedId: leaseId,
    relatedType: "lease",
    uploadedBy: "system",
  });

  return path;
}
