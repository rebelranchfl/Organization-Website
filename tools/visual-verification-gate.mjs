#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const CLAIMS = [
  "BUILT_LOCALLY",
  "TECHNICALLY_CHECKED",
  "VISUALLY_REVIEWED",
  "LOCALLY_VERIFIED",
  "OWNER_APPROVED",
  "DEPLOYED",
  "PUBLICLY_VERIFIED",
];

const CONTROLLED_RESULT_KEYS = new Set([
  "status",
  "verified",
  "claimAllowed",
  "calculatedStatus",
  "result",
]);

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function nonempty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function findRepoRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(current, ".git"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(start);
    current = parent;
  }
}

function resolveFrom(base, value) {
  if (!nonempty(value)) return null;
  return path.isAbsolute(value) ? path.normalize(value) : path.resolve(base, value);
}

function pngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error("not a readable PNG");
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function scanControlledKeys(value, location = "manifest", found = []) {
  if (!value || typeof value !== "object") return found;
  for (const [key, child] of Object.entries(value)) {
    const childLocation = `${location}.${key}`;
    if (CONTROLLED_RESULT_KEYS.has(key)) found.push(childLocation);
    scanControlledKeys(child, childLocation, found);
  }
  return found;
}

function stateCoverage(entries, states, category, errors, reviewer = null) {
  if (!Array.isArray(entries) || entries.length === 0) {
    errors.push(`${category}: no checks were recorded`);
    return false;
  }

  let passes = true;
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      errors.push(`${category}: contains an invalid check`);
      passes = false;
      continue;
    }
    if (entry.pass !== true) {
      errors.push(`${category}/${entry.state ?? "unknown"}: check did not pass`);
      passes = false;
    }
    if (!nonempty(entry.evidence)) {
      errors.push(`${category}/${entry.state ?? "unknown"}: evidence reference is missing`);
      passes = false;
    }
    if (reviewer !== null && entry.reviewer !== reviewer) {
      errors.push(`${category}/${entry.state ?? "unknown"}: reviewer does not match the independent reviewer`);
      passes = false;
    }
  }

  const allPassed = entries.some((entry) => entry?.state === "all" && entry.pass === true);
  for (const state of states) {
    const covered = allPassed || entries.some((entry) => entry?.state === state && entry.pass === true);
    if (!covered) {
      errors.push(`${category}: required state '${state}' is not covered by a passing check`);
      passes = false;
    }
  }
  return passes;
}

function evaluate(manifest, { baseDir, manifestHash = null } = {}) {
  const errors = [];
  const gates = {};
  const controlled = scanControlledKeys(manifest);
  if (controlled.length) {
    errors.push(`claim gate: self-assigned result fields are prohibited (${controlled.join(", ")})`);
  }

  if (manifest?.schemaVersion !== 1) errors.push("manifest: schemaVersion must be 1");
  if (!CLAIMS.includes(manifest?.claimTarget)) errors.push(`manifest: claimTarget must be one of ${CLAIMS.join(", ")}`);

  const builder = manifest?.builder;
  const reviewer = manifest?.reviewer;
  if (!nonempty(builder)) errors.push("independent review: builder name is missing");
  if (!nonempty(reviewer)) errors.push("independent review: reviewer name is missing");
  if (nonempty(builder) && nonempty(reviewer) && builder.trim().toLowerCase() === reviewer.trim().toLowerCase()) {
    errors.push("independent review: builder and reviewer must be different");
  }

  const sourceErrors = [];
  const targetPath = resolveFrom(baseDir, manifest?.source?.targetPath);
  const referencePath = resolveFrom(baseDir, manifest?.source?.approvedReferencePath);
  if (!targetPath || !fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
    sourceErrors.push("exact target file is missing");
  }
  if (!referencePath || !fs.existsSync(referencePath) || !fs.statSync(referencePath).isFile()) {
    sourceErrors.push("approved reference file is missing");
  } else {
    const expected = manifest?.source?.approvedReferenceSha256;
    if (!/^[a-f0-9]{64}$/i.test(expected ?? "")) {
      sourceErrors.push("approved reference SHA-256 is missing or invalid");
    } else {
      const actual = sha256(fs.readFileSync(referencePath));
      if (actual.toLowerCase() !== expected.toLowerCase()) sourceErrors.push("approved reference SHA-256 does not match");
    }
  }
  gates.source = sourceErrors.length === 0;
  errors.push(...sourceErrors.map((error) => `source gate: ${error}`));

  const scopeErrors = [];
  const modes = ["discussion", "concept only", "implementation", "correction"];
  if (!modes.includes(manifest?.scope?.mode)) scopeErrors.push("authorized mode is missing or invalid");
  if (!Array.isArray(manifest?.scope?.authorizedFiles) || manifest.scope.authorizedFiles.length === 0 || manifest.scope.authorizedFiles.some((item) => !nonempty(item))) {
    scopeErrors.push("authorized file list is missing");
  }
  if (!Array.isArray(manifest?.scope?.protectedAreas)) scopeErrors.push("protected areas must be recorded, using 'none' when applicable");
  if (manifest?.scope?.boundariesConfirmed !== true) scopeErrors.push("scope boundaries were not confirmed");
  if (!nonempty(manifest?.scope?.evidence)) scopeErrors.push("scope authority/evidence is missing");
  gates.scope = scopeErrors.length === 0;
  errors.push(...scopeErrors.map((error) => `scope gate: ${error}`));

  const states = Array.isArray(manifest?.requiredStates)
    ? [...new Set(manifest.requiredStates.filter(nonempty))]
    : [];
  if (states.length === 0) errors.push("manifest: requiredStates must contain at least one state");
  if (!states.includes(manifest?.defaultState)) errors.push("manifest: defaultState must be one of requiredStates");

  const categoryErrors = [];
  gates.build = stateCoverage(manifest?.checks?.build, states, "build gate", categoryErrors);
  gates.assetOverlay = stateCoverage(manifest?.checks?.assetOverlay, states, "asset/overlay gate", categoryErrors);
  gates.measurement = stateCoverage(manifest?.checks?.measurement, states, "measurement gate", categoryErrors);
  gates.independentVisualReview = stateCoverage(manifest?.checks?.visual, states, "visual review gate", categoryErrors, reviewer);
  errors.push(...categoryErrors);

  const screenshotErrors = [];
  const viewports = Array.isArray(manifest?.viewports) ? manifest.viewports : [];
  const viewportMap = new Map();
  for (const viewport of viewports) {
    if (!nonempty(viewport?.name) || !Number.isInteger(viewport?.width) || !Number.isInteger(viewport?.height)) {
      screenshotErrors.push("viewport name, integer width, and integer height are required");
      continue;
    }
    viewportMap.set(viewport.name, viewport);
  }
  const phone = [...viewportMap.values()].find((viewport) => viewport.width <= 456);
  const desktop = [...viewportMap.values()].find((viewport) => viewport.width >= 1180);
  if (!phone) screenshotErrors.push("a phone viewport at or below 456px is required");
  if (!desktop) screenshotErrors.push("a desktop viewport at or above 1180px is required");

  const screenshots = Array.isArray(manifest?.screenshots) ? manifest.screenshots : [];
  function requireScreenshot(state, viewport, kind) {
    if (!viewport) return;
    const match = screenshots.find((shot) => shot?.state === state && shot?.viewport === viewport.name && shot?.kind === kind);
    if (!match) {
      screenshotErrors.push(`${kind} screenshot missing for state '${state}' at viewport '${viewport.name}'`);
      return;
    }
    const filePath = resolveFrom(baseDir, match.path);
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      screenshotErrors.push(`${kind} screenshot file missing for state '${state}' at viewport '${viewport.name}'`);
      return;
    }
    try {
      const dimensions = pngDimensions(filePath);
      if (dimensions.width !== viewport.width) {
        screenshotErrors.push(`${kind} screenshot width ${dimensions.width}px does not match '${viewport.name}' width ${viewport.width}px`);
      }
    } catch (error) {
      screenshotErrors.push(`${kind} screenshot for state '${state}' at '${viewport.name}' is invalid: ${error.message}`);
    }
  }
  requireScreenshot(manifest?.defaultState, phone, "full");
  requireScreenshot(manifest?.defaultState, desktop, "full");
  for (const state of states) {
    requireScreenshot(state, phone, "close");
    requireScreenshot(state, desktop, "close");
  }
  gates.screenshots = screenshotErrors.length === 0;
  errors.push(...screenshotErrors.map((error) => `screenshot gate: ${error}`));

  const approvals = manifest?.approvals ?? {};
  gates.ownerApproval = approvals.ownerApproved === true && nonempty(approvals.ownerEvidence);
  gates.deployment = approvals.deploymentAuthorized === true && nonempty(approvals.deploymentEvidence);
  gates.publicRecheck = approvals.publicRecheckPassed === true && nonempty(approvals.publicRecheckEvidence);

  const levels = [
    ["BUILT_LOCALLY", ["source", "scope"]],
    ["TECHNICALLY_CHECKED", ["source", "scope", "build"]],
    ["VISUALLY_REVIEWED", ["source", "scope", "screenshots", "independentVisualReview"]],
    ["LOCALLY_VERIFIED", ["source", "scope", "build", "assetOverlay", "measurement", "screenshots", "independentVisualReview"]],
    ["OWNER_APPROVED", ["source", "scope", "build", "assetOverlay", "measurement", "screenshots", "independentVisualReview", "ownerApproval"]],
    ["DEPLOYED", ["source", "scope", "build", "assetOverlay", "measurement", "screenshots", "independentVisualReview", "ownerApproval", "deployment"]],
    ["PUBLICLY_VERIFIED", ["source", "scope", "build", "assetOverlay", "measurement", "screenshots", "independentVisualReview", "ownerApproval", "deployment", "publicRecheck"]],
  ];

  let highestAchieved = "NOT_VERIFIED";
  for (const [claim, requiredGates] of levels) {
    if (requiredGates.every((gate) => gates[gate])) highestAchieved = claim;
  }
  const requestedIndex = CLAIMS.indexOf(manifest?.claimTarget);
  const achievedIndex = CLAIMS.indexOf(highestAchieved);
  const claimAllowed = controlled.length === 0 && requestedIndex >= 0 && achievedIndex >= requestedIndex;

  if (!claimAllowed && requestedIndex >= 0) {
    const required = levels.find(([claim]) => claim === manifest.claimTarget)?.[1] ?? [];
    for (const gate of required) {
      if (!gates[gate]) errors.push(`requested claim: required '${gate}' gate did not pass`);
    }
  }

  return {
    schemaVersion: 1,
    requestedClaim: manifest?.claimTarget ?? null,
    claimAllowed,
    calculatedStatus: claimAllowed ? manifest.claimTarget : "NOT_VERIFIED",
    highestSupportedStatus: highestAchieved,
    gates,
    errors: [...new Set(errors)],
    manifestSha256: manifestHash,
    generatedAt: new Date().toISOString(),
  };
}

function fakePng(width, height) {
  const buffer = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(buffer, 0);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function selfTest() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "visual-gate-"));
  try {
    const target = path.join(temp, "target.html");
    const reference = path.join(temp, "reference.png");
    fs.writeFileSync(target, "<main>test</main>");
    fs.writeFileSync(reference, fakePng(100, 100));
    const phoneFull = path.join(temp, "phone-full.png");
    const phoneClose = path.join(temp, "phone-close.png");
    const desktopFull = path.join(temp, "desktop-full.png");
    const desktopClose = path.join(temp, "desktop-close.png");
    fs.writeFileSync(phoneFull, fakePng(430, 932));
    fs.writeFileSync(phoneClose, fakePng(430, 500));
    fs.writeFileSync(desktopFull, fakePng(1280, 900));
    fs.writeFileSync(desktopClose, fakePng(1280, 600));

    const manifest = {
      schemaVersion: 1,
      claimTarget: "LOCALLY_VERIFIED",
      builder: "builder",
      reviewer: "reviewer",
      source: {
        targetPath: target,
        approvedReferencePath: reference,
        approvedReferenceSha256: sha256(fs.readFileSync(reference)),
      },
      scope: {
        mode: "correction",
        authorizedFiles: [target],
        protectedAreas: ["none"],
        boundariesConfirmed: true,
        evidence: "owner-authorized test",
      },
      requiredStates: ["default"],
      defaultState: "default",
      viewports: [
        { name: "phone", width: 430, height: 932 },
        { name: "desktop", width: 1280, height: 900 },
      ],
      checks: {
        build: [{ state: "all", pass: true, evidence: "test" }],
        assetOverlay: [{ state: "all", pass: true, evidence: "test" }],
        measurement: [{ state: "all", pass: true, evidence: "test" }],
        visual: [{ state: "all", reviewer: "reviewer", pass: true, evidence: "test" }],
      },
      screenshots: [
        { state: "default", viewport: "phone", kind: "full", path: phoneFull },
        { state: "default", viewport: "desktop", kind: "full", path: desktopFull },
        { state: "default", viewport: "phone", kind: "close", path: phoneClose },
        { state: "default", viewport: "desktop", kind: "close", path: desktopClose },
      ],
      approvals: {},
    };

    const passing = evaluate(manifest, { baseDir: temp });
    if (!passing.claimAllowed || passing.calculatedStatus !== "LOCALLY_VERIFIED") {
      throw new Error(`passing fixture was refused: ${passing.errors.join("; ")}`);
    }

    const selfReported = structuredClone(manifest);
    selfReported.status = "LOCALLY_VERIFIED";
    const refused = evaluate(selfReported, { baseDir: temp });
    if (refused.claimAllowed || refused.calculatedStatus !== "NOT_VERIFIED") {
      throw new Error("self-assigned status was not refused");
    }

    const missingEvidence = structuredClone(manifest);
    missingEvidence.screenshots = [];
    const missing = evaluate(missingEvidence, { baseDir: temp });
    if (missing.claimAllowed || missing.calculatedStatus !== "NOT_VERIFIED") {
      throw new Error("missing screenshot evidence was not refused");
    }
    console.log("SELF-TEST PASS: complete evidence passes; self-reported status and missing evidence are refused.");
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function printUsage() {
  console.error("Usage: node tools/visual-verification-gate.mjs <manifest.json> [--out <report.json>]");
  console.error("       node tools/visual-verification-gate.mjs --self-test");
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--self-test") {
    selfTest();
    return;
  }
  if (!args[0]) {
    printUsage();
    process.exitCode = 2;
    return;
  }

  const manifestPath = path.resolve(args[0]);
  const outIndex = args.indexOf("--out");
  const outPath = outIndex >= 0 && args[outIndex + 1] ? path.resolve(args[outIndex + 1]) : null;
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    process.exitCode = 2;
    return;
  }

  const raw = fs.readFileSync(manifestPath);
  let manifest;
  try {
    manifest = JSON.parse(raw.toString("utf8"));
  } catch (error) {
    console.error(`Manifest is not valid JSON: ${error.message}`);
    process.exitCode = 2;
    return;
  }

  const repoRoot = findRepoRoot(path.dirname(manifestPath));
  const report = evaluate(manifest, { baseDir: repoRoot, manifestHash: sha256(raw) });
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (outPath) {
    const relative = path.relative(repoRoot, outPath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      console.error("Report output must remain inside the repository.");
      process.exitCode = 2;
      return;
    }
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output, { flag: "wx" });
  }
  process.stdout.write(output);
  process.exitCode = report.claimAllowed ? 0 : 1;
}

main();
