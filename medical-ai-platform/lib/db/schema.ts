import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { eq, relations, sql } from "drizzle-orm";

// =====================================================
// 1. USERS (Clerk-backed Identity)
// =====================================================
export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clerkId: text("clerk_id").unique().notNull(),
    role: text("role", { enum: ["patient", "doctor", "admin"] }).notNull(),
    name: text("name").notNull(),
    email: text("email").unique().notNull(),
    imageUrl: text("image_url"),
    specialty: text("specialty"), // doctor only
    age: integer("age"),
    gender: text("gender"),
    bloodType: text("blood_type"),
    medicalHistory: text("medical_history"),
    phone: text("phone"),
    isOnboarded: integer("is_onboarded", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// =====================================================
// 2. DOCTOR PROFILES (Extended Doctor Info)
// =====================================================
export const doctorProfiles = sqliteTable("doctor_profiles", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull().unique(),
    specialty: text("specialty").notNull().default("General Medicine"),
    degree: text("degree").notNull().default("MBBS"),
    experience: integer("experience").default(0),
    licenseNumber: text("license_number"),
    rating: real("rating").default(5.0),
    totalConsultations: integer("total_consultations").default(0),
    totalScansReviewed: integer("total_scans_reviewed").default(0),
});

// =====================================================
// 3. SCANS (Diagnostic Events)
// =====================================================
export const scans = sqliteTable("scans", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    patientId: integer("patient_id").references(() => users.id).notNull(),
    doctorId: integer("doctor_id").references(() => users.id),
    imageUrl: text("image_url").notNull(),
    modality: text("modality", { enum: ["brain", "lung", "skin", "ecg"] }).notNull(),
    status: text("status", { enum: ["pending", "processing", "completed", "rejected"] }).notNull().default("pending"),
    priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
    symptoms: text("symptoms"),
    triageScore: integer("triage_score"),
    aiDiagnosis: text("ai_diagnosis"),
    aiConfidence: real("ai_confidence"),
    aiUncertainty: real("ai_uncertainty"),
    heatmapUrl: text("heatmap_url"),
    expertUsed: text("expert_used"),
    doctorNotes: text("doctor_notes"),
    originalFilename: text("original_filename"),
    uploadedAt: integer("uploaded_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
});

// =====================================================
// 3. REPORTS (Clinical Reports)
// =====================================================
export const reports = sqliteTable("reports", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    scanId: integer("scan_id").references(() => scans.id).notNull(),
    patientId: integer("patient_id").references(() => users.id).notNull(),
    doctorId: integer("doctor_id").references(() => users.id).notNull(),
    diagnosis: text("diagnosis").notNull(),
    findings: text("findings").notNull(),
    recommendations: text("recommendations"),
    severity: text("severity", { enum: ["low", "moderate", "high", "critical"] }).notNull().default("moderate"),
    status: text("status", { enum: ["draft", "signed"] }).notNull().default("draft"),
    language: text("language").notNull().default("en"),
    templateId: integer("template_id").references(() => templates.id),
    signedAt: integer("signed_at", { mode: "timestamp" }),
    pdfUrl: text("pdf_url"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// =====================================================
// 4. CONVERSATIONS (Patient-Doctor Chat)
// =====================================================
export const conversations = sqliteTable("conversations", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    patientId: integer("patient_id").references(() => users.id).notNull(),
    doctorId: integer("doctor_id").references(() => users.id).notNull(),
    lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// =====================================================
// 5. MESSAGES
// =====================================================
export const messages = sqliteTable("messages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
    senderId: integer("sender_id").references(() => users.id).notNull(),
    content: text("content").notNull(),
    type: text("type", { enum: ["text", "scan", "report"] }).notNull().default("text"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// =====================================================
// 6. APPOINTMENTS
// =====================================================
export const appointments = sqliteTable("appointments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    patientId: integer("patient_id").references(() => users.id).notNull(),
    doctorId: integer("doctor_id").references(() => users.id).notNull(),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
    type: text("type", { enum: ["initial", "follow_up", "emergency", "review"] }).notNull().default("follow_up"),
    notes: text("notes"),
    status: text("status", { enum: ["scheduled", "confirmed", "completed", "cancelled"] }).notNull().default("scheduled"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// =====================================================
// 7. TEMPLATES (Report Templates)
// =====================================================
export const templates = sqliteTable("templates", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    structureJson: text("structure_json").notNull(), // JSON: {findings, impression, recommendations}
    language: text("language").notNull().default("en"),
});

// =====================================================
// 8. NOTIFICATIONS
// =====================================================
export const notifications = sqliteTable("notifications", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    type: text("type", { enum: ["scan_ready", "report_signed", "urgent_alert", "message_received", "appointment", "appointment_scheduled", "scan_completed"] }).notNull(),
    message: text("message").notNull(),
    link: text("link"),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// =====================================================
// 9. FAMILY MEMBERS
// =====================================================
export const familyMembers = sqliteTable("family_members", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    patientId: integer("patient_id").references(() => users.id).notNull(),
    relation: text("relation").notNull(), // spouse, child, parent
    name: text("name").notNull(),
});

// =====================================================
// RELATIONS
// =====================================================
export const doctorProfilesRelations = relations(doctorProfiles, ({ one }) => ({
    user: one(users, { fields: [doctorProfiles.userId], references: [users.id] }),
}));

// =====================================================
// 4. FOLLOW-UPS (Automation)
// =====================================================
export const followUps = sqliteTable("follow_ups", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    scanId: integer("scan_id").references(() => scans.id),
    patientId: integer("patient_id").references(() => users.id),
    scheduledFor: integer("scheduled_for").notNull(), // Unix timestamp
    type: text("type", { enum: ["email", "call"] }).notNull(),
    status: text("status", { enum: ["pending", "sent", "failed", "cancelled"] }).default("pending"),
    createdAt: integer("created_at").default(sql`(unixepoch())`),
});

// =====================================================
// 5. VOICE NOTES (Web Speech API)
// =====================================================
export const voiceNotes = sqliteTable("voice_notes", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    scanId: integer("scan_id").references(() => scans.id),
    transcription: text("transcription").notNull(),
    audioUrl: text("audio_url"), // Optional: if we save the blob later
    createdAt: integer("created_at").default(sql`(unixepoch())`),
});

export const usersRelations = relations(users, ({ one, many }) => ({
    doctorProfile: one(doctorProfiles),
    scansAsPatient: many(scans, { relationName: "patientScans" }),
    scansAsDoctor: many(scans, { relationName: "doctorScans" }),
    notifications: many(notifications),
    followUps: many(followUps),
}));

export const scansRelations = relations(scans, ({ one, many }) => ({
    patient: one(users, { fields: [scans.patientId], references: [users.id], relationName: "patientScans" }),
    doctor: one(users, { fields: [scans.doctorId], references: [users.id], relationName: "doctorScans" }),
    reports: many(reports),
    messages: many(messages),
    followUps: many(followUps),
    voiceNotes: many(voiceNotes),
}));

export const followUpsRelations = relations(followUps, ({ one }) => ({
    scan: one(scans, { fields: [followUps.scanId], references: [scans.id] }),
    patient: one(users, { fields: [followUps.patientId], references: [users.id] }),
}));

export const voiceNotesRelations = relations(voiceNotes, ({ one }) => ({
    scan: one(scans, { fields: [voiceNotes.scanId], references: [scans.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
    scan: one(scans, { fields: [reports.scanId], references: [scans.id] }),
    patient: one(users, { fields: [reports.patientId], references: [users.id] }),
    doctor: one(users, { fields: [reports.doctorId], references: [users.id] }),
    template: one(templates, { fields: [reports.templateId], references: [templates.id] }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
    patient: one(users, { fields: [appointments.patientId], references: [users.id] }),
    doctor: one(users, { fields: [appointments.doctorId], references: [users.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
    patient: one(users, { fields: [conversations.patientId], references: [users.id] }),
    doctor: one(users, { fields: [conversations.doctorId], references: [users.id] }),
    messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
    sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));
