"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveDriverDocument = exports.getDriverDocuments = void 0;
const prisma_1 = require("../lib/prisma");
const DOCUMENT_TYPES = [
    'LICENSE',
    'NATIONAL_ID',
    'REGISTRATION_BOOK',
    'INSURANCE',
];
const findDriver = async (driverRef) => {
    return prisma_1.prisma.driver.findFirst({
        where: {
            OR: [
                { id: driverRef },
                { plateNumber: driverRef },
                { licenseNumber: driverRef },
                { user: { phone: driverRef } },
            ],
        },
    });
};
const getDriverDocuments = async (req, res) => {
    try {
        const driverRef = String(req.params.id);
        const driver = await findDriver(driverRef);
        if (!driver) {
            return res.status(200).json({ success: true, documents: [] });
        }
        const documents = await prisma_1.prisma.driverDocument.findMany({
            where: { driverId: driver.id },
            orderBy: { type: 'asc' },
        });
        return res.status(200).json({
            success: true,
            documents: documents.map((doc) => ({
                id: doc.id,
                type: doc.type,
                url: doc.url,
                publicId: doc.publicId,
                updatedAt: doc.updatedAt.toISOString(),
            })),
            requiredTypes: DOCUMENT_TYPES,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load documents';
        return res.status(500).json({ error: message });
    }
};
exports.getDriverDocuments = getDriverDocuments;
const saveDriverDocument = async (req, res) => {
    try {
        const driverRef = String(req.params.id);
        const { type, url, publicId, phone } = req.body;
        if (!type || !url) {
            return res.status(400).json({ error: 'type and url are required' });
        }
        if (!DOCUMENT_TYPES.includes(type)) {
            return res.status(400).json({ error: 'Invalid document type' });
        }
        const driver = await findDriver(driverRef);
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        if (phone) {
            const owner = await prisma_1.prisma.user.findUnique({ where: { id: driver.userId } });
            const normalized = String(phone).replace(/\s/g, '');
            if (owner?.phone.replace(/\s/g, '') !== normalized && owner?.phone !== phone) {
                return res.status(403).json({ error: 'Not authorized to upload for this driver' });
            }
        }
        const document = await prisma_1.prisma.driverDocument.upsert({
            where: {
                driverId_type: {
                    driverId: driver.id,
                    type,
                },
            },
            create: {
                driverId: driver.id,
                type,
                url,
                publicId: publicId ?? null,
            },
            update: {
                url,
                publicId: publicId ?? null,
            },
        });
        return res.status(200).json({
            success: true,
            message: 'Document saved',
            document: {
                id: document.id,
                type: document.type,
                url: document.url,
                publicId: document.publicId,
                updatedAt: document.updatedAt.toISOString(),
            },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save document';
        return res.status(500).json({ error: message });
    }
};
exports.saveDriverDocument = saveDriverDocument;
