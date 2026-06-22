"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var lucide_react_1 = require("lucide-react");
var sweetalert2_1 = require("sweetalert2");
var AdminLayout_1 = require("@/components/admin/AdminLayout");
var client_1 = require("@/integrations/supabase/client");
var cfitScoring_1 = require("@/lib/cfitScoring");
var discScoring_1 = require("@/lib/discScoring");
var istScoring_1 = require("@/lib/istScoring");
var mbtiScoring_1 = require("@/lib/mbtiScoring");
var msdtScoring_1 = require("@/lib/msdtScoring");
var papiScoring_1 = require("@/lib/papiScoring");
var personalityPlusScoring_1 = require("@/lib/personalityPlusScoring");
var recharts_1 = require("recharts");
var COLORS = ["#2dd4bf", "#60a5fa", "#f59e0b", "#ef4444", "#a78bfa", "#f472b6", "#34d399", "#fb923c"];
var safeParseArray = function (value) {
    if (Array.isArray(value))
        return value;
    if (typeof value !== "string" || !value.trim())
        return [];
    try {
        var parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch (_a) {
        return [];
    }
};
var compactJoin = function (parts) {
    return parts.map(function (part) { return String(part || "").trim(); }).filter(Boolean).join(" - ");
};
var getLatestEducationText = function (profile, fallback) {
    if (fallback === void 0) { fallback = ""; }
    var history = safeParseArray(profile === null || profile === void 0 ? void 0 : profile.education_history);
    var latest = history.length > 0 ? history[history.length - 1] : null;
    if (latest) {
        var text = compactJoin([
            latest.level || latest.education_level || latest.degree,
            latest.major || latest.field_of_study || latest.education_major,
            latest.school || latest.institution || latest.education_institution,
            latest.end_year || latest.graduation_year || latest.year,
        ]);
        if (text)
            return text;
    }
    return compactJoin([profile === null || profile === void 0 ? void 0 : profile.education_level, profile === null || profile === void 0 ? void 0 : profile.education_major, profile === null || profile === void 0 ? void 0 : profile.education_institution]) || fallback;
};
var normalizeOptionCode = function (value) { return String(value || "").trim().replace(/\.$/, "").toUpperCase(); };
var isOptionCodeOnly = function (value) { return /^[A-Z]$/.test(normalizeOptionCode(value)); };
var getAnswerDisplayText = function (answer, showLabel) {
    var _a;
    if (showLabel === void 0) { showLabel = true; }
    if ((_a = answer.selected_answer) === null || _a === void 0 ? void 0 : _a.includes("PALING"))
        return answer.selected_answer;
    var label = normalizeOptionCode(answer.selected_answer_label);
    var text = String(answer.selected_answer || "").trim();
    if (!text)
        return label || "-";
    if (!showLabel || !label || normalizeOptionCode(text) === label)
        return text;
    return "".concat(label, ". ").concat(text);
};
var DISC_DIMS = ["D", "I", "S", "C"];
var DISC_DIM_MAP = {
    D: "Dominance",
    I: "Influence",
    S: "Steadiness",
    C: "Compliance",
};
var getDiscValue = function (cats, dim, kind) {
    var _a, _b;
    var fullName = DISC_DIM_MAP[dim];
    if (kind === "N")
        return Number((_b = (_a = cats[dim]) !== null && _a !== void 0 ? _a : cats[fullName]) !== null && _b !== void 0 ? _b : 0);
    return cats["".concat(dim, "_").concat(kind)] !== undefined
        ? Number(cats["".concat(dim, "_").concat(kind)])
        : cats["".concat(fullName, "_").concat(kind)] !== undefined
            ? Number(cats["".concat(fullName, "_").concat(kind)])
            : null;
};
var buildDiscRows = function (cats, totalQuestions) {
    if (totalQuestions === void 0) { totalQuestions = 24; }
    var discLabels = {
        D: "Dominance — Pengarah, tegas, berorientasi hasil",
        I: "Influence — Persuasif, ekspresif, sosial",
        S: "Steadiness — Stabil, sabar, kooperatif",
        C: "Conscientiousness — Teliti, analitis, sistematis",
    };
    var discColors = { D: "#dc2626", I: "#f59e0b", S: "#059669", C: "#2563eb" };
    var threshold = Math.ceil(Math.max(totalQuestions, 1) * 0.25);
    var rows = DISC_DIMS.map(function (dim) {
        var net = getDiscValue(cats, dim, "N");
        var m = getDiscValue(cats, dim, "M");
        var l = getDiscValue(cats, dim, "L");
        var level = net >= threshold ? "Tinggi" : net >= 1 ? "Sedang" : net <= -threshold ? "Rendah" : "Netral";
        return { dim: dim, m: m, l: l, net: net, level: level, absNet: Math.abs(net), desc: discLabels[dim], color: discColors[dim] };
    });
    var ranked = __spreadArray([], rows, true).sort(function (a, b) { return b.net - a.net; });
    return rows.map(function (row) { return (__assign(__assign({}, row), { rank: ranked.findIndex(function (r) { return r.dim === row.dim; }) + 1 })); });
};
var IST_SUBTESTS = [
    { code: "SE", name: "Sentence Completion", max: 20, area: "Pengetahuan bahasa dan pemahaman konsep verbal" },
    { code: "WA", name: "Word Association", max: 20, area: "Kemampuan abstraksi verbal dan asosiasi kata" },
    { code: "AN", name: "Analogy", max: 20, area: "Penalaran analogis dan hubungan logis" },
    { code: "GE", name: "Generalization", max: 32, area: "Pembentukan konsep umum dan generalisasi" },
    { code: "RA", name: "Arithmetic", max: 20, area: "Kemampuan berhitung dan pemecahan masalah numerik" },
    { code: "ZR", name: "Number Series", max: 20, area: "Penalaran induktif numerik dan pola deret" },
    { code: "FA", name: "Figure Assembly", max: 20, area: "Kemampuan analisis bentuk dan konstruksi figural" },
    { code: "WU", name: "Cube Rotation", max: 20, area: "Daya bayang ruang dan rotasi mental" },
    { code: "ME", name: "Memory", max: 20, area: "Daya ingat dan retensi informasi" },
];
var isIstResult = function (r) {
    return r.test_name.toUpperCase().includes("IST") || Object.keys(r.categories || {}).some(function (key) { return /^SE\s*-|^WA\s*-|^AN\s*-|^GE\s*-/i.test(key); });
};
var getIstSubtestScore = function (cats, code) {
    var match = Object.entries(cats).find(function (_a) {
        var key = _a[0];
        return key === code || key.startsWith("".concat(code, " -"));
    });
    return Number((match === null || match === void 0 ? void 0 : match[1]) || 0);
};
var getIstRows = function (cats) { return (0, istScoring_1.getIstRows)(cats); };
var getIstSummary = function (cats, fallbackScore) {
    return (0, istScoring_1.getIstSummary)(cats, fallbackScore);
};
var buildIstInterpretation = function (cats, fallbackScore) {
    return (0, istScoring_1.buildIstInterpretation)(cats, fallbackScore);
};
var isMbtiResult = function (r) {
    var keys = Object.keys(r.categories || {});
    return (0, mbtiScoring_1.isMbtiName)(r.test_name) || ["E", "I", "S", "N", "T", "F", "J", "P"].every(function (k) { return keys.includes(k); });
};
var getMbtiSummary = function (cats) {
    var rows = (0, mbtiScoring_1.getMbtiRows)(cats).map(function (row) { return (__assign(__assign({}, row), { pct: row.strength })); });
    return { type: (0, mbtiScoring_1.getMbtiType)(cats), rows: rows };
};
var buildMbtiInterpretation = mbtiScoring_1.buildMbtiInterpretation;
var PAPI_LABELS = Object.fromEntries(papiScoring_1.PAPI_SCALES.map(function (scale) { return [scale.code, scale.label]; }));
var isPapiResult = function (r) {
    return (0, papiScoring_1.isPapiName)(r.test_name) || (!r.test_name.toUpperCase().includes("DISC")
        && !isMbtiResult(r)
        && Object.keys(r.categories || {}).filter(function (key) { return PAPI_LABELS[key]; }).length >= 8);
};
var isMsdtResult = function (r) {
    return (0, msdtScoring_1.isMsdtName)(r.test_name)
        || Object.keys(r.categories || {}).some(function (key) { return (0, msdtScoring_1.getMsdtRows)(r.categories || {}).some(function (row) { return row.code === key; }); });
};
var PAPI_WHEEL_TEXT = {
    N: "Tuntas Tugas",
    G: "Kerja Keras",
    A: "Prestasi",
    L: "Memimpin",
    P: "Kontrol",
    I: "Keputusan",
    T: "Tempo",
    V: "Vitalitas",
    S: "Sosial",
    B: "Kelompok",
    O: "Kedekatan",
    X: "Perhatian",
    C: "Teratur",
    D: "Terinci",
    R: "Teoritis",
    Z: "Perubahan",
    E: "Emosi",
    K: "Agresivitas",
    F: "Dukung Atasan",
    W: "Aturan",
};
var PAPI_WHEEL_GROUPS = [
    { label: "ARAH KERJA", start: 0, count: 3, color: "#ef1d1d" },
    { label: "KEPEMIMPINAN", start: 3, count: 3, color: "#d81bd4" },
    { label: "AKTIFITAS", start: 6, count: 2, color: "#0b31d9" },
    { label: "PERGAULAN", start: 8, count: 4, color: "#10afd2" },
    { label: "GAYA KERJA", start: 12, count: 3, color: "#13d88a" },
    { label: "SIFAT", start: 15, count: 3, color: "#e8d500" },
    { label: "KETAATAN", start: 18, count: 2, color: "#ee8b00" },
];
var renderPapiWheelSvg = function (rows) {
    var rowByCode = new Map(rows.map(function (row) { return [row.code, row]; }));
    var orderedRows = papiScoring_1.PAPI_WHEEL_ORDER.map(function (code) { return rowByCode.get(code); }).filter(Boolean);
    var size = 680;
    var center = size / 2;
    var plotRadius = 185;
    var codeInner = 210;
    var codeOuter = 252;
    var descOuter = 304;
    var groupInner = 304;
    var groupOuter = 334;
    var step = 360 / orderedRows.length;
    var startOffset = -90 - step / 2;
    var esc = function (value) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
    var pointFor = function (index, value) {
        var angleDeg = startOffset + index * step + step / 2;
        var angle = angleDeg * (Math.PI / 180);
        var chartMax = 8;
        var distance = (Math.max(0, Math.min(chartMax, value)) / chartMax) * plotRadius;
        return {
            x: center + Math.cos(angle) * distance,
            y: center + Math.sin(angle) * distance,
        };
    };
    var polar = function (angleDeg, radius) {
        var angle = angleDeg * (Math.PI / 180);
        return {
            x: center + Math.cos(angle) * radius,
            y: center + Math.sin(angle) * radius,
        };
    };
    var arcPath = function (startDeg, endDeg, inner, outer) {
        var large = endDeg - startDeg > 180 ? 1 : 0;
        var p1 = polar(startDeg, outer);
        var p2 = polar(endDeg, outer);
        var p3 = polar(endDeg, inner);
        var p4 = polar(startDeg, inner);
        return "M ".concat(p1.x.toFixed(2), " ").concat(p1.y.toFixed(2), " A ").concat(outer, " ").concat(outer, " 0 ").concat(large, " 1 ").concat(p2.x.toFixed(2), " ").concat(p2.y.toFixed(2), " L ").concat(p3.x.toFixed(2), " ").concat(p3.y.toFixed(2), " A ").concat(inner, " ").concat(inner, " 0 ").concat(large, " 0 ").concat(p4.x.toFixed(2), " ").concat(p4.y.toFixed(2), " Z");
    };
    var readableRotate = function (angle) {
        var normalized = ((angle % 360) + 360) % 360;
        var rotation = angle + 90;
        return normalized > 90 && normalized < 270 ? rotation + 180 : rotation;
    };
    var wrapLabel = function (text, maxChars, maxLines) {
        if (maxChars === void 0) { maxChars = 9; }
        if (maxLines === void 0) { maxLines = 2; }
        var words = text.split(/\s+/).filter(Boolean);
        var lines = [];
        words.forEach(function (word) {
            var current = lines[lines.length - 1] || "";
            if (!current) {
                lines.push(word);
            }
            else if ("".concat(current, " ").concat(word).length <= maxChars) {
                lines[lines.length - 1] = "".concat(current, " ").concat(word);
            }
            else if (lines.length < maxLines) {
                lines.push(word);
            }
        });
        if (lines.length > maxLines)
            lines.length = maxLines;
        return lines;
    };
    var polygon = orderedRows.map(function (row, index) { return pointFor(index, row.value); }).map(function (p) { return "".concat(p.x.toFixed(1), ",").concat(p.y.toFixed(1)); }).join(" ");
    var maxRows = __spreadArray([], orderedRows, true).sort(function (a, b) { return b.value - a.value || a.code.localeCompare(b.code); }).slice(0, 3);
    return "\n    <div class=\"papi-wheel-card\">\n      <svg viewBox=\"0 0 ".concat(size, " ").concat(size, "\" width=\"100%\" role=\"img\" aria-label=\"Grafik PAPI Kostick\">\n        ").concat(PAPI_WHEEL_GROUPS.map(function (group) {
        var start = startOffset + group.start * step;
        var end = startOffset + (group.start + group.count) * step;
        var labelAngle = (start + end) / 2;
        var labelPoint = polar(labelAngle, (groupInner + groupOuter) / 2);
        var rotate = readableRotate(labelAngle);
        return "\n            <path d=\"".concat(arcPath(start, end, groupInner, groupOuter), "\" fill=\"").concat(group.color, "\" stroke=\"#ffffff\" stroke-width=\"2\" />\n            <text x=\"").concat(labelPoint.x.toFixed(1), "\" y=\"").concat(labelPoint.y.toFixed(1), "\" text-anchor=\"middle\" dominant-baseline=\"middle\" font-size=\"17\" font-weight=\"800\" fill=\"#ffffff\" transform=\"rotate(").concat(rotate.toFixed(1), " ").concat(labelPoint.x.toFixed(1), " ").concat(labelPoint.y.toFixed(1), ")\">").concat(esc(group.label), "</text>\n          ");
    }).join(""), "\n        ").concat(orderedRows.map(function (row, index) {
        var start = startOffset + index * step;
        var end = start + step;
        var mid = (start + end) / 2;
        var codePoint = polar(mid, (codeInner + codeOuter) / 2);
        var descPoint = polar(mid, (codeOuter + descOuter) / 2);
        var rotate = readableRotate(mid);
        var descLines = wrapLabel(PAPI_WHEEL_TEXT[row.code] || row.label);
        return "\n            <path d=\"".concat(arcPath(start, end, codeInner, codeOuter), "\" fill=\"#36d91d\" stroke=\"#ffffff\" stroke-width=\"2\" />\n            <path d=\"").concat(arcPath(start, end, codeOuter, descOuter), "\" fill=\"#fbf3a1\" stroke=\"#ffffff\" stroke-width=\"1\" />\n            <text x=\"").concat(codePoint.x.toFixed(1), "\" y=\"").concat(codePoint.y.toFixed(1), "\" text-anchor=\"middle\" dominant-baseline=\"middle\" font-size=\"26\" font-weight=\"900\" fill=\"#111827\" transform=\"rotate(").concat(rotate.toFixed(1), " ").concat(codePoint.x.toFixed(1), " ").concat(codePoint.y.toFixed(1), ")\">").concat(row.code, "</text>\n            <text x=\"").concat(descPoint.x.toFixed(1), "\" y=\"").concat(descPoint.y.toFixed(1), "\" text-anchor=\"middle\" dominant-baseline=\"middle\" font-size=\"8.5\" font-weight=\"600\" fill=\"#111827\" transform=\"rotate(").concat(rotate.toFixed(1), " ").concat(descPoint.x.toFixed(1), " ").concat(descPoint.y.toFixed(1), ")\">\n              ").concat(descLines.map(function (line, lineIndex) { return "<tspan x=\"".concat(descPoint.x.toFixed(1), "\" dy=\"").concat(lineIndex === 0 ? -(descLines.length - 1) * 4.5 : 9, "\">").concat(esc(line), "</tspan>"); }).join(""), "\n            </text>\n          ");
    }).join(""), "\n        ").concat([1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (ring) {
        var r = (ring / 9) * plotRadius;
        return "<circle cx=\"".concat(center, "\" cy=\"").concat(center, "\" r=\"").concat(r.toFixed(1), "\" fill=\"none\" stroke=\"").concat(ring % 3 === 0 ? "#d1d5db" : "#e5e7eb", "\" stroke-width=\"").concat(ring % 3 === 0 ? 1.25 : 0.8, "\" />");
    }).join(""), "\n        ").concat(orderedRows.map(function (row, index) {
        var end = pointFor(index, 9);
        return "\n            <line x1=\"".concat(center, "\" y1=\"").concat(center, "\" x2=\"").concat(end.x.toFixed(1), "\" y2=\"").concat(end.y.toFixed(1), "\" stroke=\"#d1d5db\" stroke-width=\"1\" />\n          ");
    }).join(""), "\n        ").concat([0, 3, 6, 9].map(function (tick) {
        var p = pointFor(0, tick);
        return "<text x=\"".concat((p.x + 12).toFixed(1), "\" y=\"").concat(p.y.toFixed(1), "\" text-anchor=\"start\" dominant-baseline=\"middle\" font-size=\"10\" font-weight=\"700\" fill=\"#64748b\">").concat(tick, "</text>");
    }).join(""), "\n        <polygon points=\"").concat(polygon, "\" fill=\"#2563eb\" fill-opacity=\"0.20\" stroke=\"#1d4ed8\" stroke-width=\"2.5\" stroke-linejoin=\"round\" />\n        ").concat(orderedRows.map(function (row, index) {
        var p = pointFor(index, row.value);
        var label = pointFor(index, Math.min(9.75, row.value + 0.55));
        return "<circle cx=\"".concat(p.x.toFixed(1), "\" cy=\"").concat(p.y.toFixed(1), "\" r=\"4.5\" fill=\"#1d4ed8\" stroke=\"#ffffff\" stroke-width=\"2\" />\n            <text x=\"").concat(label.x.toFixed(1), "\" y=\"").concat(label.y.toFixed(1), "\" text-anchor=\"middle\" dominant-baseline=\"middle\" font-size=\"10.5\" font-weight=\"900\" fill=\"#1d4ed8\" stroke=\"#ffffff\" stroke-width=\"2.5\" paint-order=\"stroke\">").concat(row.value, "</text>");
    }).join(""), "\n        <circle cx=\"").concat(center, "\" cy=\"").concat(center, "\" r=\"3\" fill=\"#111827\" />\n      </svg>\n      <div class=\"papi-wheel-summary\">\n        <strong>Skala tertinggi:</strong> ").concat(maxRows.map(function (row) { return "".concat(row.code, " ").concat(row.value, "/").concat(row.max); }).join(", "), "\n      </div>\n    </div>");
};
var isKraepelinResult = function (r) {
    return r.test_name.toUpperCase().includes("KRAEPELIN") || ["speed", "accuracy", "stability", "work_capacity"].some(function (key) { return key in (r.categories || {}); });
};
var isPersonalityPlusResult = function (r) {
    var upper = r.test_name.toUpperCase();
    var keys = Object.keys(r.categories || {}).map(function (key) { return key.toUpperCase(); });
    return upper.includes("PERSONALITY") || upper.includes("TEMPERAMEN") || ["KOLERIS", "MELANKOLIS", "PLEGMATIS", "SANGUINIS"].some(function (key) { return keys.includes(key); });
};
var getResultConclusion = function (r, answerRows) {
    var _a, _b, _c, _d;
    if (answerRows === void 0) { answerRows = []; }
    var cats = isPapiResult(r) && answerRows.length > 0
        ? getEffectivePapiCategories(r, answerRows)
        : r.categories || {};
    var upper = r.test_name.toUpperCase();
    if (upper.includes("DISC")) {
        var ranked = buildDiscRows(cats, r.total_questions || 24).sort(function (a, b) { return b.net - a.net; });
        return ranked.slice(0, 2).map(function (row) { return "".concat(row.dim, "(").concat(row.net, ")"); }).join("/");
    }
    if (isPersonalityPlusResult(r)) {
        var codeMap_1 = { Sanguinis: "S", Koleris: "K", Melankolis: "M", Plegmatis: "P" };
        var ranked = (0, personalityPlusScoring_1.getPersonalityPlusRows)(cats).sort(function (a, b) { return b.value - a.value || a.name.localeCompare(b.name); });
        return ranked.slice(0, 2).map(function (row) { return "".concat(codeMap_1[row.name] || row.name[0], "(").concat(row.value, ")"); }).join("/");
    }
    if ((0, cfitScoring_1.isCfitName)(r.test_name)) {
        var info = (0, cfitScoring_1.getCfitIqInfoFromResult)(r);
        return "IQ ".concat(info.iq, " (").concat(info.classification, ")");
    }
    if (isMbtiResult(r)) {
        return "MBTI ".concat(getMbtiSummary(cats).type);
    }
    if (isIstResult(r)) {
        var summary = getIstSummary(cats, r.score);
        return "IST ".concat(summary.score, "%");
    }
    if (isPapiResult(r)) {
        var ranked = (0, papiScoring_1.getPapiRows)(cats).sort(function (a, b) { return b.value - a.value || a.code.localeCompare(b.code); });
        return ranked.slice(0, 2).map(function (row) { return "".concat(row.code, "(").concat(row.value, ")"); }).join("/");
    }
    if (isKraepelinResult(r)) {
        var rows = getKraepelinRows(cats);
        var accuracy = (_b = (_a = rows.find(function (row) { return row.key === "accuracy"; })) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0;
        var stability = (_d = (_c = rows.find(function (row) { return row.key === "stability"; })) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0;
        return "Akurasi ".concat(accuracy, "% / Stabil ").concat(stability, "%");
    }
    if (isAptitudeResult(r)) {
        var info = getAptitudeScoreInfo(r);
        var level = getAptitudeLevel(info.iq);
        return "IQ ".concat(info.iq, " (").concat(level.label, ")");
    }
    return r.total_questions ? "".concat(r.answered_questions, "/").concat(r.total_questions, " soal") : "".concat(r.score, "%");
};
var getResultStatusBadge = function (r) {
    var statusText = "".concat(r.status || "", " ").concat(r.interpretation || "").toLowerCase();
    if (/(cheat|cheating|pelanggaran|violation|kamera)/i.test(statusText)) {
        return { label: "Cheat", className: "bg-destructive/10 text-destructive" };
    }
    if (r.total_questions > 0 && r.answered_questions < r.total_questions) {
        return { label: "Tidak Selesai", className: "bg-amber-400/10 text-amber-400" };
    }
    return { label: "Selesai", className: "bg-emerald-400/10 text-emerald-400" };
};
var escapeCsv = function (value) {
    var text = String(value !== null && value !== void 0 ? value : "");
    return /[",\n]/.test(text) ? "\"".concat(text.replace(/"/g, '""'), "\"") : text;
};
var escapeHtml = function (value) {
    return String(value !== null && value !== void 0 ? value : "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};
var formatPapiInterpretationHtml = function (text) {
    var lines = text.split("\n").map(function (line) { return line.trim(); }).filter(Boolean);
    var html = "";
    var listOpen = false;
    var closeList = function () {
        if (listOpen) {
            html += "</ul>";
            listOpen = false;
        }
    };
    lines.forEach(function (line) {
        var isHeading = (/^[A-Z0-9\s]+$/.test(line) && line.length <= 44) || (/^[A-Za-zÀ-ÿ0-9\s/]+:$/.test(line) && line.length <= 56);
        if (isHeading) {
            closeList();
            html += "<h4 class=\"papi-interpretation-heading\">".concat(escapeHtml(line.replace(/:$/, "")), "</h4>");
        }
        else if (line.startsWith("- ")) {
            if (!listOpen) {
                html += "<ul class=\"papi-interpretation-list\">";
                listOpen = true;
            }
            html += "<li>".concat(escapeHtml(line.slice(2)), "</li>");
        }
        else {
            closeList();
            html += "<p class=\"papi-interpretation-paragraph\">".concat(escapeHtml(line), "</p>");
        }
    });
    closeList();
    return html;
};
var getKraepelinRows = function (cats) { return [
    { key: "speed", label: "Kecepatan", value: Number(cats.speed || 0) },
    { key: "accuracy", label: "Ketelitian", value: Number(cats.accuracy || 0) },
    { key: "stability", label: "Stabilitas", value: Number(cats.stability || 0) },
    { key: "work_capacity", label: "Kapasitas Kerja", value: Number(cats.work_capacity || 0) },
]; };
var APTITUDE_AREAS = [
    { key: "Verbal", label: "Verbal", max: 11, note: "Analogi kata, relasi konsep, perbendaharaan kata, dan pemahaman hubungan bahasa." },
    { key: "Numerical", label: "Numerik", max: 10, note: "Berhitung praktis, deret angka, proporsi, dan pemecahan masalah kuantitatif." },
    { key: "Logic", label: "Logika", max: 6, note: "Penalaran deduktif, silogisme, dan konsistensi kesimpulan." },
    { key: "Classification", label: "Klasifikasi", max: 12, note: "Membedakan kategori, mencari item yang tidak sejenis, dan ketelitian konsep." },
    { key: "Pattern", label: "Pola", max: 3, note: "Pola simbol, susunan huruf/angka, dan aturan transformasi sederhana." },
    { key: "Abstract", label: "Figural/Abstrak", max: 18, note: "Penalaran gambar, analogi bentuk, rotasi/transformasi, dan persepsi visual." },
];
var APTITUDE_CATEGORY_ALIASES = {
    Verbal: ["verbal ability", "verbal aptitude", "verbal_ability", "verbal aptitude", "kemampuan verbal"],
    Numerical: ["numerical ability", "numerical aptitude", "numerical_ability", "numerik", "kemampuan numerik"],
    Logic: ["logical reasoning", "logika", "logical_reasoning", "reasoning logic", "kemampuan logika"],
    Classification: ["classifications", "classification", "klasifikasi", "classification ability"],
    Pattern: ["pattern recognition", "pattern", "pola", "pattern_recognition"],
    Abstract: ["abstract reasoning", "figural", "abstract", "figural/abstrak", "kemampuan abstrak"],
};
var APTITUDE_CATEGORY_BY_QUESTION_NUMBER = {
    1: "Classification", 2: "Verbal", 3: "Abstract", 4: "Classification", 5: "Abstract",
    6: "Numerical", 7: "Verbal", 8: "Classification", 9: "Verbal", 10: "Abstract",
    11: "Verbal", 12: "Logic", 13: "Abstract", 14: "Verbal", 15: "Numerical",
    16: "Classification", 17: "Abstract", 18: "Logic", 19: "Classification", 20: "Pattern",
    21: "Verbal", 22: "Abstract", 23: "Verbal", 24: "Logic", 25: "Abstract",
    26: "Pattern", 27: "Abstract", 28: "Numerical", 29: "Classification", 30: "Abstract",
    31: "Classification", 32: "Numerical", 33: "Classification", 34: "Numerical", 35: "Abstract",
    36: "Logic", 37: "Classification", 38: "Verbal", 39: "Abstract", 40: "Numerical",
    41: "Abstract", 42: "Verbal", 43: "Abstract", 44: "Logic", 45: "Classification",
    46: "Abstract", 47: "Verbal", 48: "Numerical", 49: "Abstract", 50: "Verbal",
    51: "Abstract", 52: "Numerical", 53: "Verbal", 54: "Numerical", 55: "Classification",
    56: "Logic", 57: "Abstract", 58: "Classification", 59: "Abstract", 60: "Numerical",
};
var normalizeAptitudeCategoryKey = function (value) {
    return String(value || "").trim().toLowerCase().replace(/[_\s\/\-]+/g, " ");
};
var resolveAptitudeCategoryKey = function (value) {
    var _a;
    var normalized = normalizeAptitudeCategoryKey(value);
    if (!normalized)
        return null;
    var exact = APTITUDE_AREAS.find(function (area) { return normalizeAptitudeCategoryKey(area.key) === normalized; });
    if (exact)
        return exact.key;
    var alias = Object.entries(APTITUDE_CATEGORY_ALIASES).find(function (_a) {
        var aliases = _a[1];
        return aliases.some(function (alias) { return normalizeAptitudeCategoryKey(alias) === normalized; });
    });
    if (alias)
        return alias[0];
    var fuzzy = APTITUDE_AREAS.find(function (area) { return normalized.includes(normalizeAptitudeCategoryKey(area.key)) || normalized.includes(normalizeAptitudeCategoryKey(area.label)); });
    return (_a = fuzzy === null || fuzzy === void 0 ? void 0 : fuzzy.key) !== null && _a !== void 0 ? _a : null;
};
var isAptitudeResult = function (r) {
    return (r.test_name.toUpperCase().includes("APTITUDE") && !(0, cfitScoring_1.isCfitName)(r.test_name)) ||
        (!(0, cfitScoring_1.isCfitName)(r.test_name) && Object.keys(r.categories || {}).some(function (key) { return resolveAptitudeCategoryKey(key) !== null; }));
};
var classifyAptitudeIq = function (iq) {
    if (iq < 85)
        return "Kecerdasan di bawah rata-rata";
    if (iq < 100)
        return "Kecerdasan rata-rata";
    if (iq < 115)
        return "Kecerdasan di atas rata-rata";
    if (iq < 130)
        return "Kecerdasan tinggi";
    if (iq < 145)
        return "Kecerdasan superior";
    return "Sangat berbakat";
};
var getAptitudeLevel = function (score) {
    if (score >= 145)
        return { label: "Sangat berbakat", recommendation: "Sangat Disarankan" };
    if (score >= 130)
        return { label: "Kecerdasan superior", recommendation: "Sangat Disarankan" };
    if (score >= 115)
        return { label: "Kecerdasan tinggi", recommendation: "Disarankan" };
    if (score >= 100)
        return { label: "Kecerdasan di atas rata-rata", recommendation: "Disarankan" };
    if (score >= 85)
        return { label: "Kecerdasan rata-rata", recommendation: "Cukup Disarankan" };
    return { label: "Kecerdasan di bawah rata-rata", recommendation: "Perlu Pertimbangan" };
};
var getAptitudeAreaValue = function (cats, area) {
    var _a, _b;
    var exact = Number((_a = cats[area.key]) !== null && _a !== void 0 ? _a : 0);
    if (exact !== 0)
        return exact;
    var entry = Object.entries(cats).find(function (_a) {
        var key = _a[0];
        return resolveAptitudeCategoryKey(key) === area.key;
    });
    return Number((_b = entry === null || entry === void 0 ? void 0 : entry[1]) !== null && _b !== void 0 ? _b : 0);
};
var getAptitudeRows = function (cats) {
    return APTITUDE_AREAS.map(function (area) {
        var raw = getAptitudeAreaValue(cats, area);
        var pct = Math.round((raw / area.max) * 100);
        var level = pct >= 80 ? "Sangat Baik" : pct >= 65 ? "Baik" : pct >= 50 ? "Cukup" : pct >= 35 ? "Rendah" : "Sangat Rendah";
        return __assign(__assign({}, area), { raw: raw, pct: pct, level: level });
    });
};
var getAptitudeRawValue = function (categories, result) {
    var _a, _b, _c, _d, _e;
    var explicitRaw = (_e = (_d = (_c = (_b = (_a = categories.correct_answers) !== null && _a !== void 0 ? _a : categories["Aptitude Raw Score"]) !== null && _b !== void 0 ? _b : categories.correct) !== null && _c !== void 0 ? _c : categories.raw_score) !== null && _d !== void 0 ? _d : categories["Correct Answers"]) !== null && _e !== void 0 ? _e : null;
    if (explicitRaw !== null && explicitRaw !== undefined && !Number.isNaN(Number(explicitRaw))) {
        return Math.max(0, Math.round(Number(explicitRaw)));
    }
    var categorySum = APTITUDE_AREAS.reduce(function (sum, area) { return sum + getAptitudeAreaValue(categories, area); }, 0);
    if (categorySum > 0)
        return categorySum;
    return Math.round((result.score / 100) * Math.max(1, result.total_questions || 0));
};
var getAptitudeScoreInfo = function (result) {
    var categories = result.categories || {};
    var raw = getAptitudeRawValue(categories, result);
    var total = Math.max(1, result.total_questions || 0);
    var cappedRaw = Math.min(raw, total);
    var scaledRaw = Math.min(49, Math.round((cappedRaw / total) * 49));
    var derived = (0, cfitScoring_1.getCfitIqInfo)(scaledRaw);
    return {
        raw: cappedRaw,
        total: total,
        percentage: Math.round((cappedRaw / total) * 100),
        iq: Number(categories["Aptitude IQ"] || 0) || derived.iq,
        classification: classifyAptitudeIq(Number(categories["Aptitude IQ"] || 0) || derived.iq),
    };
};
var buildAptitudeInterpretation = function (cats, score, answered, total) {
    var rows = getAptitudeRows(cats);
    var info = getAptitudeScoreInfo({ categories: cats, score: score, total_questions: total });
    var level = getAptitudeLevel(info.iq);
    var strongest = __spreadArray([], rows, true).sort(function (a, b) { return b.pct - a.pct; }).slice(0, 2);
    var weakest = __spreadArray([], rows, true).sort(function (a, b) { return a.pct - b.pct; }).slice(0, 2);
    var correct = getAptitudeRawValue(cats, { categories: cats, score: score, total_questions: total });
    var wrong = Math.max(0, answered - correct);
    return "RINGKASAN IQ\n- Estimasi IQ: ".concat(info.iq, "\n- Klasifikasi IQ: ").concat(info.classification, "\n- Raw score: ").concat(correct, "/").concat(total, " benar (").concat(info.percentage, "%); ").concat(wrong, " salah dari ").concat(answered, " soal dijawab.\n- Rekomendasi seleksi: ").concat(level.recommendation, "\n\nACUAN KATEGORI\n- <85: Kecerdasan di bawah rata-rata\n- 85-100: Kecerdasan rata-rata\n- 100-115: Kecerdasan di atas rata-rata\n- 115-130: Kecerdasan tinggi\n- 130-145: Kecerdasan superior\n- 145+: Sangat berbakat\n\nKEKUATAN RELATIF\n- ").concat(strongest.map(function (row) { return "".concat(row.label, ": ").concat(row.raw, "/").concat(row.max, " (").concat(row.pct, "%; ").concat(row.level, ")"); }).join("\n- "), "\n\nAREA PERHATIAN\n- ").concat(weakest.map(function (row) { return "".concat(row.label, ": ").concat(row.raw, "/").concat(row.max, " (").concat(row.pct, "%; ").concat(row.level, ")"); }).join("\n- "), "\n- Area ini sebaiknya divalidasi melalui wawancara berbasis kasus, riwayat pendidikan/kerja, dan contoh pekerjaan yang relevan.\n\nPROFIL ASPEK\n").concat(rows.map(function (row) { return "- ".concat(row.label, ": ").concat(row.raw, "/").concat(row.max, " (").concat(row.level, ")"); }).join("\n"), "\n\nCATATAN SKORING\n- Tes menggunakan correct-only scoring: jawaban benar bernilai 1, jawaban salah atau kosong bernilai 0.\n- Raw score dikonversi menjadi estimasi IQ untuk laporan hasil.\n- Interpretasi ini bukan keputusan tunggal; gunakan bersama hasil wawancara, observasi perilaku saat tes, pengalaman kerja, dan tuntutan jabatan.");
};
var buildAptitudeCategoriesFromAnswers = function (answerRows, totalQuestions) {
    if (totalQuestions === void 0) { totalQuestions = 60; }
    var cats = {};
    var correct = 0;
    var wrong = 0;
    answerRows.forEach(function (answer) {
        if (answer.is_correct === true) {
            correct += 1;
            var key = resolveAptitudeCategoryKey(answer.category) || APTITUDE_CATEGORY_BY_QUESTION_NUMBER[answer.question_number] || "Abstract";
            cats[key] = (cats[key] || 0) + 1;
        }
        else if (answer.is_correct === false) {
            wrong += 1;
        }
    });
    cats.correct_answers = correct;
    cats.wrong_answers = wrong;
    cats.blank_answers = Math.max(0, totalQuestions - answerRows.length);
    cats.accuracy = answerRows.length ? Math.round((correct / answerRows.length) * 100) : 0;
    cats["Aptitude Raw Score"] = correct;
    cats["Aptitude Max Score"] = totalQuestions;
    cats["Aptitude Percentage"] = Math.round((correct / Math.max(totalQuestions, 1)) * 100);
    var iq = (0, cfitScoring_1.getCfitIqInfo)(Math.min(49, Math.round((correct / Math.max(totalQuestions, 1)) * 49)));
    cats["Aptitude IQ"] = iq.iq;
    return cats;
};
var getEffectiveAptitudeCategories = function (result, answerRows) {
    var stored = result.categories || {};
    var storedRaw = getAptitudeRawValue(stored, result);
    var storedAreaSum = APTITUDE_AREAS.reduce(function (sum, area) { return sum + getAptitudeAreaValue(stored, area); }, 0);
    if (storedRaw > 0 && storedAreaSum > 0)
        return stored;
    var rebuilt = buildAptitudeCategoriesFromAnswers(answerRows, result.total_questions || 60);
    if (getAptitudeRawValue(rebuilt, result) === 0)
        return stored;
    return __assign(__assign({}, stored), rebuilt);
};
var getEffectivePapiCategories = function (result, answerRows) {
    if (!isPapiResult(result))
        return result.categories;
    if (!answerRows.length)
        return result.categories;
    var rebuilt = (0, papiScoring_1.buildPapiCategoriesFromAnswers)(answerRows);
    // if the rebuilt result is empty, fallback to stored categories
    var total = Object.values(rebuilt).reduce(function (sum, value) { return sum + value; }, 0);
    if (total === 0)
        return result.categories;
    return rebuilt;
};
var buildKraepelinInterpretation = function (cats) {
    var rows = getKraepelinRows(cats);
    var level = function (v) { return v >= 80 ? "sangat tinggi" : v >= 60 ? "tinggi" : v >= 40 ? "cukup" : v >= 20 ? "rendah" : "sangat rendah"; };
    return "Profil Kraepelin menunjukkan ".concat(rows.map(function (row) { return "".concat(row.label.toLowerCase(), " ").concat(level(row.value), " (").concat(row.value, "%)"); }).join(", "), ".\n\nJawaban benar ").concat(Number(cats.correct_answers || 0), " dan salah ").concat(Number(cats.wrong_answers || 0), ". Kolom terselesaikan ").concat(Number(cats.columns_completed || 0), ", rata-rata benar per kolom ").concat(Number(cats.average_column || 0), ", dan puncak benar per kolom ").concat(Number(cats.peak_column || 0), ".\n\nSecara psikologis, hasil ini menggambarkan pola kerja hitung sederhana dalam tekanan waktu: tempo kerja, ketelitian, stabilitas/fluktuasi performa antar kolom, dan daya tahan kerja rutin. Interpretasi akhir perlu dibandingkan dengan tuntutan jabatan, terutama toleransi kesalahan, kebutuhan konsistensi, dan ritme kerja target.");
};
var renderDiscPrintMiniChart = function (title, data, color, allowNegative) {
    if (allowNegative === void 0) { allowNegative = false; }
    var width = 260;
    var height = 170;
    var left = 30;
    var right = 12;
    var top = 18;
    var bottom = 32;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var values = data.map(function (d) { return d.value; });
    var min = allowNegative ? Math.min.apply(Math, __spreadArray([0], values, false)) : 0;
    var max = Math.max.apply(Math, __spreadArray([1], values, false));
    var range = Math.max(max - min, 1);
    var y = function (value) { return top + ((max - value) / range) * plotHeight; };
    var points = data.map(function (d, i) { return (__assign({ x: left + (data.length === 1 ? plotWidth / 2 : (i * plotWidth) / (data.length - 1)), y: y(d.value) }, d)); });
    var baseline = y(allowNegative ? 0 : min);
    var linePath = points.map(function (p) { return "".concat(p.x, ",").concat(p.y); }).join(" ");
    var areaPath = "M ".concat(points[0].x, " ").concat(baseline, " L ").concat(points.map(function (p) { return "".concat(p.x, " ").concat(p.y); }).join(" L "), " L ").concat(points[points.length - 1].x, " ").concat(baseline, " Z");
    var gridY = [0, 0.5, 1].map(function (ratio) { return top + ratio * plotHeight; });
    return "\n    <div style=\"border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;padding:10px;\">\n      <p style=\"font-size:8.5pt;font-weight:700;color:#374151;margin-bottom:4px;text-align:center;\">".concat(title, "</p>\n      <svg width=\"100%\" height=\"").concat(height, "\" viewBox=\"0 0 ").concat(width, " ").concat(height, "\" role=\"img\" aria-label=\"").concat(title, "\">\n        ").concat(gridY.map(function (gy) { return "<line x1=\"".concat(left, "\" y1=\"").concat(gy, "\" x2=\"").concat(width - right, "\" y2=\"").concat(gy, "\" stroke=\"#e2e8f0\" stroke-width=\"1\"/>"); }).join(""), "\n        ").concat(allowNegative ? "<line x1=\"".concat(left, "\" y1=\"").concat(baseline, "\" x2=\"").concat(width - right, "\" y2=\"").concat(baseline, "\" stroke=\"#94a3b8\" stroke-width=\"1.5\" stroke-dasharray=\"4,3\"/>") : "", "\n        <line x1=\"").concat(left, "\" y1=\"").concat(top, "\" x2=\"").concat(left, "\" y2=\"").concat(height - bottom, "\" stroke=\"#94a3b8\" stroke-width=\"1\"/>\n        <line x1=\"").concat(left, "\" y1=\"").concat(height - bottom, "\" x2=\"").concat(width - right, "\" y2=\"").concat(height - bottom, "\" stroke=\"#94a3b8\" stroke-width=\"1\"/>\n        <path d=\"").concat(areaPath, "\" fill=\"").concat(color, "\" opacity=\"0.16\"/>\n        <polyline points=\"").concat(linePath, "\" fill=\"none\" stroke=\"").concat(color, "\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n        ").concat(points.map(function (p) { return "\n          <circle cx=\"".concat(p.x, "\" cy=\"").concat(p.y, "\" r=\"4.5\" fill=\"").concat(color, "\" stroke=\"#ffffff\" stroke-width=\"2\"/>\n          <text x=\"").concat(p.x, "\" y=\"").concat(p.y - 8, "\" text-anchor=\"middle\" font-size=\"8\" font-weight=\"700\" fill=\"#374151\">").concat(p.value > 0 ? '+' : '').concat(p.value, "</text>\n          <text x=\"").concat(p.x, "\" y=\"").concat(height - 10, "\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"700\" fill=\"#64748b\">").concat(p.name, "</text>\n        "); }).join(""), "\n      </svg>\n    </div>\n  ");
};
var Results = function () {
    var _a, _b;
    var location = (0, react_router_dom_1.useLocation)();
    var initialSearch = ((_a = location.state) === null || _a === void 0 ? void 0 : _a.search) || new URLSearchParams(location.search).get("q") || "";
    var _c = (0, react_1.useState)([]), results = _c[0], setResults = _c[1];
    var _d = (0, react_1.useState)(initialSearch), search = _d[0], setSearch = _d[1];
    var _e = (0, react_1.useState)(null), selectedResult = _e[0], setSelectedResult = _e[1];
    var _f = (0, react_1.useState)([]), answers = _f[0], setAnswers = _f[1];
    var _g = (0, react_1.useState)({}), answersByResult = _g[0], setAnswersByResult = _g[1];
    var _h = (0, react_1.useState)(true), loading = _h[0], setLoading = _h[1];
    var printRef = (0, react_1.useRef)(null);
    // Filter states
    var _j = (0, react_1.useState)("all"), filterStatus = _j[0], setFilterStatus = _j[1];
    var _k = (0, react_1.useState)("all"), filterTest = _k[0], setFilterTest = _k[1];
    var _l = (0, react_1.useState)(""), filterDateFrom = _l[0], setFilterDateFrom = _l[1];
    var _m = (0, react_1.useState)(""), filterDateTo = _m[0], setFilterDateTo = _m[1];
    // Pagination states
    var _o = (0, react_1.useState)(1), currentPage = _o[0], setCurrentPage = _o[1];
    var _p = (0, react_1.useState)(10), itemsPerPage = _p[0], setItemsPerPage = _p[1];
    var load = function () { return __awaiter(void 0, void 0, void 0, function () {
        var data, rows, emails, profileByEmail, profiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client_1.supabase.from("test_results").select("*").order("completed_at", { ascending: false })];
                case 1:
                    data = (_a.sent()).data;
                    rows = (data || []);
                    emails = Array.from(new Set(rows.map(function (row) { var _a; return (_a = row.candidate_profile) === null || _a === void 0 ? void 0 : _a.email; }).filter(Boolean)));
                    profileByEmail = new Map();
                    if (!(emails.length > 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, client_1.supabase
                            .from("candidate_profiles")
                            .select("email, education_level, education_major, education_institution, education_history, photo_url")
                            .in("email", emails)];
                case 2:
                    profiles = (_a.sent()).data;
                    profileByEmail = new Map((profiles || []).map(function (profile) { return [String(profile.email || "").toLowerCase(), profile]; }));
                    _a.label = 3;
                case 3:
                    setResults(rows.map(function (row) {
                        var profile = row.candidate_profile || {};
                        var email = String(profile.email || "").toLowerCase();
                        var latestProfile = profileByEmail.get(email);
                        var education = getLatestEducationText(latestProfile, profile.education || "");
                        if (!education && !(latestProfile === null || latestProfile === void 0 ? void 0 : latestProfile.photo_url))
                            return row;
                        return __assign(__assign({}, row), { candidate_profile: __assign(__assign({}, profile), { education: profile.education || education, photo_url: profile.photo_url || (latestProfile === null || latestProfile === void 0 ? void 0 : latestProfile.photo_url) || "" }) });
                    }));
                    setLoading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () { load(); }, []);
    var loadAnswersForResultIds = function (resultIds) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, answerData, error, grouped;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (resultIds.length === 0)
                        return [2 /*return*/];
                    return [4 /*yield*/, client_1.supabase
                            .from("test_answers")
                            .select("*")
                            .in("test_result_id", resultIds)
                            .order("test_result_id", { ascending: true })
                            .order("question_number", { ascending: true })];
                case 1:
                    _a = _b.sent(), answerData = _a.data, error = _a.error;
                    if (error || !answerData)
                        return [2 /*return*/];
                    grouped = {};
                    answerData.forEach(function (row) {
                        var resultId = String(row.test_result_id || "");
                        if (!resultId)
                            return;
                        grouped[resultId] = grouped[resultId] || [];
                        grouped[resultId].push(row);
                    });
                    return [4 /*yield*/, Promise.all(Object.entries(grouped).map(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                            var result, _c, _d;
                            var resultId = _b[0], rows = _b[1];
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        result = results.find(function (r) { return r.id === resultId; });
                                        if (!result)
                                            return [2 /*return*/];
                                        _c = grouped;
                                        _d = resultId;
                                        return [4 /*yield*/, enrichAnswersWithOptionText(result, rows)];
                                    case 1:
                                        _c[_d] = _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    _b.sent();
                    setAnswersByResult(function (prev) { return (__assign(__assign({}, prev), grouped)); });
                    return [2 /*return*/];
            }
        });
    }); };
    var enrichAnswersWithOptionText = function (result, rows) { return __awaiter(void 0, void 0, void 0, function () {
        var needsLookup, instrument, questionNumbers, questions, optionByQuestionAndLabel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    needsLookup = rows.some(function (row) {
                        var _a;
                        if ((_a = row.selected_answer) === null || _a === void 0 ? void 0 : _a.includes("PALING"))
                            return false;
                        return isOptionCodeOnly(row.selected_answer) || isOptionCodeOnly(row.selected_answer_label);
                    });
                    if (!needsLookup)
                        return [2 /*return*/, rows];
                    return [4 /*yield*/, client_1.supabase
                            .from("test_instruments")
                            .select("id")
                            .eq("name", result.test_name)
                            .maybeSingle()];
                case 1:
                    instrument = (_a.sent()).data;
                    if (!(instrument === null || instrument === void 0 ? void 0 : instrument.id))
                        return [2 /*return*/, rows];
                    questionNumbers = Array.from(new Set(rows.map(function (row) { return row.question_number; })));
                    return [4 /*yield*/, client_1.supabase
                            .from("test_questions")
                            .select("question_number, test_question_options(option_label, option_text, category_target)")
                            .eq("instrument_id", instrument.id)
                            .in("question_number", questionNumbers)];
                case 2:
                    questions = (_a.sent()).data;
                    optionByQuestionAndLabel = new Map();
                    (questions || []).forEach(function (question) {
                        (question.test_question_options || []).forEach(function (option) {
                            optionByQuestionAndLabel.set("".concat(question.question_number, ":").concat(normalizeOptionCode(option.option_label)), option);
                        });
                    });
                    return [2 /*return*/, rows.map(function (row) {
                            var _a, _b;
                            if ((_a = row.selected_answer) === null || _a === void 0 ? void 0 : _a.includes("PALING"))
                                return row;
                            var lookupLabel = normalizeOptionCode(row.selected_answer_label) || normalizeOptionCode(row.selected_answer);
                            var option = optionByQuestionAndLabel.get("".concat(row.question_number, ":").concat(lookupLabel));
                            if (!(option === null || option === void 0 ? void 0 : option.option_text))
                                return row;
                            return __assign(__assign({}, row), { selected_answer: option.option_text, selected_answer_label: option.option_label || row.selected_answer_label, category: ((_b = option.category_target) === null || _b === void 0 ? void 0 : _b.trim()) || row.category });
                        })];
            }
        });
    }); };
    var loadAnswers = function (result) { return __awaiter(void 0, void 0, void 0, function () {
        var resultId, data, rows, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    resultId = result.id;
                    return [4 /*yield*/, client_1.supabase.from("test_answers").select("*").eq("test_result_id", resultId).order("question_number")];
                case 1:
                    data = (_b.sent()).data;
                    rows = (data || []);
                    _a = setAnswers;
                    return [4 /*yield*/, enrichAnswersWithOptionText(result, rows)];
                case 2:
                    _a.apply(void 0, [_b.sent()]);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteResult = function (r) { return __awaiter(void 0, void 0, void 0, function () {
        var confirm, answersError, resultError, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, sweetalert2_1.default.fire({
                        icon: "warning",
                        title: "Hapus Hasil Tes?",
                        html: "\n        <div style=\"text-align:left;line-height:1.6\">\n          <p>Hasil tes ini akan dihapus permanen dari halaman admin.</p>\n          <p style=\"margin-top:8px\"><b>Kandidat:</b> ".concat(r.candidate_name, "</p>\n          <p><b>Tes:</b> ").concat(r.test_name, "</p>\n        </div>\n      "),
                        showCancelButton: true,
                        confirmButtonText: "Ya, Hapus",
                        cancelButtonText: "Batal",
                        confirmButtonColor: "hsl(0, 72%, 51%)",
                    })];
                case 1:
                    confirm = _a.sent();
                    if (!confirm.isConfirmed)
                        return [2 /*return*/];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 6, , 8]);
                    return [4 /*yield*/, client_1.supabase.from("test_answers").delete().eq("test_result_id", r.id)];
                case 3:
                    answersError = (_a.sent()).error;
                    if (answersError)
                        throw answersError;
                    return [4 /*yield*/, client_1.supabase.from("test_results").delete().eq("id", r.id)];
                case 4:
                    resultError = (_a.sent()).error;
                    if (resultError)
                        throw resultError;
                    if ((selectedResult === null || selectedResult === void 0 ? void 0 : selectedResult.id) === r.id) {
                        setSelectedResult(null);
                        setAnswers([]);
                    }
                    setResults(function (prev) { return prev.filter(function (item) { return item.id !== r.id; }); });
                    return [4 /*yield*/, sweetalert2_1.default.fire({
                            icon: "success",
                            title: "Hasil Tes Dihapus",
                            text: "Data hasil tes berhasil dihapus.",
                            timer: 1600,
                            showConfirmButton: false,
                        })];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 6:
                    error_1 = _a.sent();
                    return [4 /*yield*/, sweetalert2_1.default.fire({
                            icon: "error",
                            title: "Gagal Menghapus",
                            text: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || "Terjadi kesalahan saat menghapus hasil tes.",
                        })];
                case 7:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handleSelectResult = function (r) { return __awaiter(void 0, void 0, void 0, function () {
        var enrichedResult, currentProfile, email, candidateProfile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    enrichedResult = r;
                    currentProfile = (r.candidate_profile || {});
                    email = currentProfile.email;
                    if (!email) return [3 /*break*/, 2];
                    return [4 /*yield*/, client_1.supabase
                            .from("candidate_profiles")
                            .select("photo_url, phone, birth_date, education_level, education_institution, gender")
                            .eq("email", email)
                            .maybeSingle()];
                case 1:
                    candidateProfile = (_a.sent()).data;
                    if (candidateProfile) {
                        enrichedResult = __assign(__assign({}, r), { candidate_profile: __assign(__assign({}, currentProfile), { phone: candidateProfile.phone || currentProfile.phone || "", birthDate: candidateProfile.birth_date || currentProfile.birthDate || "", education: candidateProfile.education_level || candidateProfile.education_institution || currentProfile.education || "", gender: candidateProfile.gender || currentProfile.gender || "", photo_url: candidateProfile.photo_url || currentProfile.photo_url || null }) });
                    }
                    _a.label = 2;
                case 2:
                    setSelectedResult(enrichedResult);
                    return [4 /*yield*/, loadAnswers(enrichedResult)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var filtered = results.filter(function (r) { return r.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
        r.position.toLowerCase().includes(search.toLowerCase()) ||
        r.test_name.toLowerCase().includes(search.toLowerCase()); }).filter(function (r) {
        if (filterStatus !== "all") {
            var status_1 = getResultStatusBadge(r).label;
            if (filterStatus === "completed" && status_1 !== "Selesai")
                return false;
            if (filterStatus === "incomplete" && status_1 !== "Tidak Selesai")
                return false;
            if (filterStatus === "cheat" && status_1 !== "Cheat")
                return false;
        }
        if (filterTest !== "all" && r.test_name !== filterTest)
            return false;
        if (filterDateFrom && r.completed_at && r.completed_at < filterDateFrom)
            return false;
        if (filterDateTo && r.completed_at && r.completed_at > filterDateTo + "T23:59:59")
            return false;
        return true;
    });
    // Get unique test names for filter dropdown
    var uniqueTests = Array.from(new Set(results.map(function (r) { return r.test_name; }))).sort();
    // Pagination logic
    var totalPages = Math.ceil(filtered.length / itemsPerPage);
    var paginatedResults = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    (0, react_1.useEffect)(function () {
        var visiblePapiResultIds = paginatedResults
            .filter(function (r) { return isPapiResult(r); })
            .map(function (r) { return r.id; })
            .filter(function (id) { return !answersByResult[id]; });
        if (visiblePapiResultIds.length > 0) {
            loadAnswersForResultIds(visiblePapiResultIds);
        }
    }, [paginatedResults, answersByResult]);
    // Reset to page 1 when filters change
    (0, react_1.useEffect)(function () {
        setCurrentPage(1);
    }, [search, filterStatus, filterTest, filterDateFrom, filterDateTo]);
    var handlePrint = function () {
        if (!selectedResult)
            return;
        var r = selectedResult;
        var profile = r.candidate_profile;
        var cats = isPapiResult(r)
            ? getEffectivePapiCategories(r, answers)
            : isAptitudeResult(r)
                ? getEffectiveAptitudeCategories(r, answers)
                : r.categories;
        var scoreResult = isAptitudeResult(r) ? __assign(__assign({}, r), { categories: cats }) : r;
        var catEntries = Object.entries(cats);
        var cfitProfileRows = (0, cfitScoring_1.isCfitName)(r.test_name) ? (0, cfitScoring_1.getCfitProfileRows)(r) : [];
        var maxVal = isPapiResult(r) ? 8 : isMsdtResult(r) ? 64 : 100;
        // Generate DISC charts and interpretation if test is DISC
        var discChartsHTML = "";
        var discInterpretation = "";
        if (r.test_name.toUpperCase().includes("DISC")) {
            var dims = DISC_DIMS;
            // Get top 2 dominant categories
            var discRows = buildDiscRows(cats, r.total_questions || 24);
            var sortedCats = __spreadArray([], discRows, true).sort(function (a, b) { return b.net - a.net; });
            var topCategories = sortedCats.slice(0, 2).map(function (_a) {
                var dim = _a.dim;
                return dim;
            });
            var dominant = topCategories[0];
            var secondary = topCategories[1];
            discInterpretation = "\n        <div class=\"section\">\n          <div class=\"section-title\">Interpretasi Psikolog - Analisa DISC</div>\n          <div class=\"interpretation\">".concat(formatPapiInterpretationHtml((0, discScoring_1.buildDiscInterpretation)(cats, r.total_questions || 24)), "</div>\n        </div>");
            var discDataWithRank = discRows;
            discChartsHTML = "\n    <div class=\"section\">\n      <div class=\"section-title\">Detail Skor per Dimensi</div>\n      <table style=\"width:100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 12px;\">\n        <thead>\n          <tr style=\"background: #f1f5f9;\">\n            <th style=\"padding: 6px; text-align: left; border: 1px solid #cbd5e1; font-weight: 600;\">Dimensi</th>\n            <th style=\"padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;\" title=\"Most/Mask - Paling Sesuai\">M</th>\n            <th style=\"padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;\" title=\"Least/Core - Paling Tidak Sesuai\">L</th>\n            <th style=\"padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;\" title=\"Net = M - L (Mirror)\">Net</th>\n            <th style=\"padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;\">Level</th>\n            <th style=\"padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;\">Rank</th>\n            <th style=\"padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600; width: 25%;\">Visual</th>\n          </tr>\n        </thead>\n        <tbody>\n          ".concat(discDataWithRank.map(function (d) {
                var _a, _b;
                return "\n            <tr>\n              <td style=\"padding: 6px; border: 1px solid #e2e8f0;\">\n                <div style=\"font-weight: 700; color: ".concat(d.color, "; font-size: 12pt;\">").concat(d.dim, "</div>\n                <div style=\"font-size: 8pt; color: #64748b; line-height: 1.2;\">").concat(d.desc, "</div>\n              </td>\n              <td style=\"padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;\">").concat((_a = d.m) !== null && _a !== void 0 ? _a : "-", "</td>\n              <td style=\"padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;\">").concat((_b = d.l) !== null && _b !== void 0 ? _b : "-", "</td>\n              <td style=\"padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: ").concat(d.net > 0 ? '#059669' : d.net < 0 ? '#dc2626' : '#64748b', ";\">").concat(d.net > 0 ? '+' : '').concat(d.net, "</td>\n              <td style=\"padding: 6px; border: 1px solid #e2e8f0; text-align: center;\">\n                <span style=\"padding: 2px 8px; border-radius: 12px; font-size: 8pt; font-weight: 600; background: ").concat(d.level === 'Tinggi' ? '#fef3c7' : d.level === 'Sedang' ? '#dbeafe' : d.level === 'Netral' ? '#f3f4f6' : '#fee2e2', "; color: ").concat(d.level === 'Tinggi' ? '#d97706' : d.level === 'Sedang' ? '#2563eb' : d.level === 'Netral' ? '#6b7280' : '#dc2626', ";\">").concat(d.level, "</span>\n              </td>\n              <td style=\"padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: ").concat(d.rank === 1 ? '#dc2626' : d.rank === 2 ? '#d97706' : '#64748b', ";\">#").concat(d.rank, "</td>\n              <td style=\"padding: 6px; border: 1px solid #e2e8f0;\">\n                <div style=\"display: flex; align-items: center; gap: 4px;\">\n                  <div style=\"flex: 1; background: #f1f5f9; height: 16px; border-radius: 3px; overflow: hidden; position: relative;\">\n                    <div style=\"position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: #9ca3af;\"></div>\n                    ").concat(d.net !== 0 ? "<div style=\"position: absolute; ".concat(d.net > 0 ? 'left: 50%' : 'right: 50%', "; height: 100%; width: ").concat(Math.min(Math.abs(d.net) * 4, 50), "%; background: ").concat(d.net > 0 ? '#34d399' : '#f87171', "; border-radius: ").concat(d.net > 0 ? '0 3px 3px 0' : '3px 0 0 3px', ";\"></div>") : '', "\n                  </div>\n                </div>\n              </td>\n            </tr>\n          ");
            }).join(''), "\n        </tbody>\n      </table>\n      <div style=\"font-size: 8pt; color: #64748b; margin-bottom: 12px; background: #f8fafc; padding: 8px; border-radius: 4px;\">\n        <strong>M (Most):</strong> jumlah dipilih sebagai \"Paling Sesuai\" (Mask). \n        <strong>L (Least):</strong> jumlah dipilih sebagai \"Paling Tidak Sesuai\" (Core). \n        <strong>Net:</strong> M \u2212 L \u2192 kekuatan natural (Mirror). \n        <strong>Rank:</strong> urutan kekuatan dimensi (1 = paling dominan).\n      </div>\n      \n      <div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;\">\n        ").concat(renderDiscPrintMiniChart("Mask - Public Self (Most)", discDataWithRank.map(function (d) { var _a; return ({ name: d.dim, value: (_a = d.m) !== null && _a !== void 0 ? _a : 0 }); }), "#10b981"), "\n        ").concat(renderDiscPrintMiniChart("Core - Private Self (Least)", discDataWithRank.map(function (d) { var _a; return ({ name: d.dim, value: (_a = d.l) !== null && _a !== void 0 ? _a : 0 }); }), "#f59e0b"), "\n        ").concat(renderDiscPrintMiniChart("Mirror - Perceived Self (Net)", discDataWithRank.map(function (d) { return ({ name: d.dim, value: d.net }); }), "#ec4899", true), "\n      </div>\n    </div>");
        }
        var istProfileHTML = "";
        var istInterpretationHTML = "";
        if (isIstResult(r)) {
            var summary = getIstSummary(cats, r.score);
            istProfileHTML = "\n        <div class=\"section\">\n          <div class=\"section-title\">Profil Subtes IST</div>\n          <table class=\"dim-table\">\n            <thead><tr><th>Subtes</th><th>Aspek</th><th>Skor</th><th>Level</th><th>Indikator</th></tr></thead>\n            <tbody>\n              ".concat(summary.rows.map(function (row) { return "\n                <tr>\n                  <td><strong>".concat(row.code, " - ").concat(row.name, "</strong></td>\n                  <td>").concat(row.area, "</td>\n                  <td>").concat(row.raw, "/").concat(row.max, " (").concat(row.pct, "%)</td>\n                  <td>").concat(row.level, "</td>\n                  <td><div class=\"bar-container\"><div class=\"bar-fill\" style=\"width:").concat(Math.min(row.pct, 100), "%; background:").concat(row.pct >= 65 ? '#059669' : row.pct >= 45 ? '#d97706' : '#dc2626', ";\"></div></div></td>\n                </tr>\n              "); }).join(""), "\n            </tbody>\n          </table>\n        </div>");
            istInterpretationHTML = "\n        <div class=\"section\">\n          <div class=\"section-title\">Interpretasi Psikolog \u2014 Profil IST</div>\n          <div class=\"interpretation\" style=\"white-space:pre-line;\">".concat(buildIstInterpretation(cats, r.score).replace(/</g, '&lt;'), "</div>\n\t        </div>");
        }
        var mbtiProfileHTML = "";
        var papiProfileHTML = "";
        var kraepelinProfileHTML = "";
        var aptitudeProfileHTML = "";
        var msdtProfileHTML = "";
        var specialInterpretationHTML = "";
        if ((0, cfitScoring_1.isCfitName)(r.test_name)) {
            specialInterpretationHTML = "<div class=\"section\"><div class=\"section-title\">Interpretasi Psikolog \u2014 Profil CFIT 3A</div><div class=\"interpretation\">".concat(formatPapiInterpretationHtml((0, cfitScoring_1.buildCfitInterpretation)(r)), "</div></div>");
        }
        else if (isMbtiResult(r)) {
            var summary = getMbtiSummary(cats);
            mbtiProfileHTML = "\n        <div class=\"section\">\n          <div class=\"section-title\">Profil MBTI</div>\n          <div class=\"score-cards\">\n            <div class=\"score-card\"><div class=\"label\">Tipe</div><div class=\"value\" style=\"letter-spacing:3px;\">".concat(summary.type, "</div></div>\n            <div class=\"score-card\"><div class=\"label\">Dimensi Dominan</div><div class=\"value\" style=\"font-size:13pt;margin-top:8px;\">").concat(summary.rows.map(function (row) { return row.dominant; }).join(" - "), "</div></div>\n            <div class=\"score-card\"><div class=\"label\">Soal Dijawab</div><div class=\"value\">").concat(r.answered_questions, "<span style=\"font-size:14pt;color:#64748b;\">/").concat(r.total_questions, "</span></div></div>\n          </div>\n          <table class=\"dim-table\">\n            <thead><tr><th>Pasangan</th><th>Skor</th><th>Dominan</th><th>Kekuatan</th></tr></thead>\n            <tbody>").concat(summary.rows.map(function (row) { return "<tr><td><strong>".concat(row.pair, "</strong></td><td>").concat(row.a, "=").concat(row.av, " / ").concat(row.b, "=").concat(row.bv, "</td><td>").concat(row.dominant, "</td><td>").concat(row.pct, "%</td></tr>"); }).join(""), "</tbody>\n          </table>\n        </div>");
            specialInterpretationHTML = "<div class=\"section\"><div class=\"section-title\">Interpretasi Psikolog \u2014 Profil MBTI</div><div class=\"interpretation\">".concat(formatPapiInterpretationHtml(buildMbtiInterpretation(cats)), "</div></div>");
        }
        else if (isKraepelinResult(r)) {
            var rows = getKraepelinRows(cats);
            kraepelinProfileHTML = "\n        <div class=\"section\">\n          <div class=\"section-title\">Profil Kraepelin</div>\n          <table class=\"dim-table\">\n            <thead><tr><th>Aspek</th><th>Skor</th><th>Indikator</th></tr></thead>\n            <tbody>\n              ".concat(rows.map(function (row) { return "<tr><td><strong>".concat(row.label, "</strong></td><td>").concat(row.value, "%</td><td><div class=\"bar-container\"><div class=\"bar-fill\" style=\"width:").concat(Math.min(row.value, 100), "%; background:").concat(row.value >= 70 ? '#059669' : row.value >= 40 ? '#d97706' : '#dc2626', ";\"></div></div></td></tr>"); }).join(""), "\n              <tr><td><strong>Benar / Salah</strong></td><td colspan=\"2\">").concat(Number(cats.correct_answers || 0), " / ").concat(Number(cats.wrong_answers || 0), "</td></tr>\n            </tbody>\n          </table>\n        </div>");
            specialInterpretationHTML = "<div class=\"section\"><div class=\"section-title\">Interpretasi Psikolog \u2014 Profil Kraepelin</div><div class=\"interpretation\" style=\"white-space:pre-line;\">".concat(buildKraepelinInterpretation(cats).replace(/</g, '&lt;'), "</div></div>");
        }
        else if (isPapiResult(r)) {
            var rows = (0, papiScoring_1.getPapiRows)(cats);
            papiProfileHTML = "\n        <div class=\"section papi-section\">\n          <div class=\"section-title\">Profil Skala PAPI Kostick</div>\n          <div class=\"papi-print-grid\">\n            <div>\n              <p class=\"mini-title\">Grafik PAPI Kostick</p>\n              ".concat(renderPapiWheelSvg(rows), "\n            </div>\n            <div>\n              <p class=\"mini-title\">Skor per Dimensi</p>\n              <table class=\"dim-table papi-score-table\">\n                <thead><tr><th>Skala</th><th>Dimensi</th><th>Skor</th><th>Level</th><th>Indikator</th></tr></thead>\n                <tbody>").concat(rows.map(function (row) {
                var pct = row.max > 0 ? (row.value / row.max) * 100 : 0;
                return "<tr>\n                    <td><strong>".concat(row.code, "</strong></td>\n                    <td>").concat(row.label, "</td>\n                    <td>").concat(row.value, "/").concat(row.max, "</td>\n                    <td>").concat(row.level, "</td>\n                    <td><div class=\"bar-container\"><div class=\"bar-fill\" style=\"width:").concat(Math.min(pct, 100), "%; background:").concat(pct >= 70 ? '#059669' : pct >= 40 ? '#d97706' : '#dc2626', ";\"></div></div></td>\n                  </tr>");
            }).join(""), "</tbody>\n              </table>\n            </div>\n          </div>\n        </div>");
            specialInterpretationHTML = "<div class=\"section\"><div class=\"section-title\">Interpretasi Psikolog \u2014 Profil PAPI</div><div class=\"interpretation\">".concat(formatPapiInterpretationHtml((0, papiScoring_1.buildPapiInterpretation)(cats)), "</div></div>");
        }
        else if (isMsdtResult(r)) {
            var rows = (0, msdtScoring_1.getMsdtRows)(cats);
            var top_1 = __spreadArray([], rows, true).sort(function (a, b) { return b.pct - a.pct || b.value - a.value || a.code.localeCompare(b.code); })[0];
            msdtProfileHTML = "\n        <div class=\"section\">\n          <div class=\"section-title\">Profil MSDT - Gaya Manajemen</div>\n          <div class=\"score-cards\">\n            <div class=\"score-card\"><div class=\"label\">Gaya Dominan</div><div class=\"value\" style=\"font-size:14pt;margin-top:8px;\">".concat(top_1.label, "</div></div>\n            <div class=\"score-card\"><div class=\"label\">Skor Dominan</div><div class=\"value\">").concat(top_1.pct, "<span style=\"font-size:14pt;color:#64748b;\">%</span></div></div>\n            <div class=\"score-card\"><div class=\"label\">Soal Dijawab</div><div class=\"value\">").concat(r.answered_questions, "<span style=\"font-size:14pt;color:#64748b;\">/").concat(r.total_questions, "</span></div></div>\n          </div>\n          <table class=\"dim-table\">\n            <thead><tr><th>Gaya</th><th>Skor</th><th>Level</th><th>Indikator</th></tr></thead>\n            <tbody>").concat(rows.map(function (row) { return "<tr><td><strong>".concat(row.label, "</strong><br/><span style=\"color:#64748b;font-size:8pt;\">").concat(row.description, "</span></td><td>").concat(row.value, " (").concat(row.pct, "%)</td><td>").concat(row.level, "</td><td><div class=\"bar-container\"><div class=\"bar-fill\" style=\"width:").concat(Math.min(row.pct, 100), "%; background:").concat(row.pct >= 76 ? '#059669' : row.pct >= 51 ? '#2563eb' : row.pct >= 26 ? '#d97706' : '#94a3b8', ";\"></div></div></td></tr>"); }).join(""), "</tbody>\n          </table>\n        </div>");
            specialInterpretationHTML = "<div class=\"section\"><div class=\"section-title\">Interpretasi Psikolog \u2014 Profil MSDT</div><div class=\"interpretation\">".concat(formatPapiInterpretationHtml((0, msdtScoring_1.buildMsdtInterpretation)(cats, r.answered_questions, r.total_questions)), "</div></div>");
        }
        else if (isAptitudeResult(r)) {
            var rows = getAptitudeRows(cats);
            var info = getAptitudeScoreInfo(scoreResult);
            var level = getAptitudeLevel(info.iq);
            aptitudeProfileHTML = "\n        <div class=\"section\">\n          <div class=\"section-title\">Profil Aptitude</div>\n          <div class=\"score-cards\">\n            <div class=\"score-card\"><div class=\"label\">Estimasi IQ</div><div class=\"value\">".concat(info.iq, "</div><div class=\"sub\">").concat(info.classification, "</div></div>\n            <div class=\"score-card\"><div class=\"label\">Rekomendasi</div><div class=\"value\" style=\"font-size:15pt;margin-top:8px;\">").concat(level.recommendation, "</div></div>\n            <div class=\"score-card\"><div class=\"label\">Benar</div><div class=\"value\">").concat(info.raw, "<span style=\"font-size:14pt;color:#64748b;\">/").concat(info.total, "</span></div><div class=\"sub\">").concat(info.percentage, "%</div></div>\n          </div>\n          <table class=\"dim-table\">\n            <thead><tr><th>Aspek</th><th>Skor</th><th>Level</th><th>Keterangan</th><th>Indikator</th></tr></thead>\n            <tbody>").concat(rows.map(function (row) { return "<tr>\n              <td><strong>".concat(row.label, "</strong></td>\n              <td>").concat(row.raw, "/").concat(row.max, " (").concat(row.pct, "%)</td>\n              <td>").concat(row.level, "</td>\n              <td>").concat(row.note, "</td>\n              <td><div class=\"bar-container\"><div class=\"bar-fill\" style=\"width:").concat(Math.min(row.pct, 100), "%; background:").concat(row.pct >= 65 ? '#059669' : row.pct >= 50 ? '#d97706' : '#dc2626', ";\"></div></div></td>\n            </tr>"); }).join(""), "</tbody>\n          </table>\n        </div>");
            specialInterpretationHTML = "<div class=\"section\"><div class=\"section-title\">Interpretasi Psikolog \u2014 Profil Aptitude</div><div class=\"interpretation\">".concat(formatPapiInterpretationHtml(buildAptitudeInterpretation(cats, r.score, r.answered_questions, r.total_questions)), "</div></div>");
        }
        var html = "<!DOCTYPE html><html lang=\"id\"><head><meta charset=\"UTF-8\"><title>Laporan Hasil Tes \u2014 ".concat(r.candidate_name, "</title>\n    <style>\n      @page { size: A4; margin: 16mm 14mm; }\n      * { margin: 0; padding: 0; box-sizing: border-box; }\n      body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background: #fff; font-size: 11pt; line-height: 1.5; }\n\n      .header { border-bottom: 3px solid #0f766e; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }\n      .header-left h1 { font-size: 18pt; color: #0f172a; margin-bottom: 2px; letter-spacing: -0.3px; }\n      .header-left p { font-size: 9pt; color: #64748b; }\n      .header-right { text-align: right; }\n      .header-right .doc-id { font-size: 8pt; color: #64748b; font-family: 'Courier New', monospace; }\n      .header-right .doc-date { font-size: 9pt; color: #475569; margin-top: 2px; }\n\n      .section { margin-bottom: 18px; page-break-inside: avoid; }\n      .section-title { font-size: 11pt; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }\n\n      .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }\n      .profile-row { display: flex; padding: 4px 0; border-bottom: 1px dashed #f1f5f9; font-size: 10pt; }\n      .profile-row .label { color: #64748b; min-width: 110px; font-weight: 500; }\n      .profile-row .value { color: #0f172a; font-weight: 600; flex: 1; }\n\n      .score-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 6px; }\n      .score-card { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 12px; text-align: center; }\n      .score-card .label { font-size: 8pt; color: #0f766e; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 600; }\n      .score-card .value { font-size: 22pt; font-weight: 800; color: #0f172a; line-height: 1.1; margin-top: 4px; }\n      .score-card .sub { font-size: 9pt; color: #64748b; }\n\n      table.dim-table { width: 100%; border-collapse: collapse; font-size: 10pt; }\n      table.dim-table th { background: #f8fafc; color: #475569; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.3px; }\n      table.dim-table td { padding: 7px 10px; border: 1px solid #e2e8f0; }\n      table.dim-table tr:nth-child(even) td { background: #fafafa; }\n      .bar-container { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; }\n      .bar-fill { height: 100%; border-radius: 4px; background: #0f766e; }\n      .mini-title { font-size: 9pt; font-weight: 700; color: #0f172a; margin: 0 0 6px; }\n      .papi-section { page-break-inside: auto; margin-bottom: 12px; }\n      .papi-print-grid { display: grid; grid-template-columns: 0.82fr 1.18fr; gap: 10px; align-items: start; }\n      .papi-wheel-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; background: #ffffff; max-width: 330px; margin: 0 auto; }\n      .papi-wheel-card svg { display: block; max-height: 300px; }\n      .papi-wheel-summary { margin-top: 3px; border-top: 1px dashed #cbd5e1; padding-top: 4px; font-size: 7.4pt; color: #475569; }\n      table.papi-score-table { font-size: 7.5pt; }\n      table.papi-score-table th { padding: 4px 5px; font-size: 6.9pt; }\n      table.papi-score-table td { padding: 3px 5px; line-height: 1.25; }\n      table.papi-score-table td:nth-child(1),\n      table.papi-score-table td:nth-child(3),\n      table.papi-score-table td:nth-child(4) { text-align: center; white-space: nowrap; }\n\n      .interpretation { background: #fefce8; border-left: 4px solid #eab308; padding: 12px 14px; border-radius: 0 6px 6px 0; font-size: 10pt; line-height: 1.7; color: #422006; }\n      .papi-interpretation-heading { margin: 8px 0 3px; color: #0f766e; font-size: 9pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.35px; }\n      .papi-interpretation-heading:first-child { margin-top: 0; }\n      .papi-interpretation-paragraph { margin: 0 0 6px; }\n      .papi-interpretation-list { margin: 0 0 6px 16px; padding: 0; }\n      .papi-interpretation-list li { margin: 1px 0; }\n\n      table.answer-table { width: 100%; border-collapse: collapse; font-size: 9pt; }\n      table.answer-table th { background: #0f172a; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.3px; }\n      table.answer-table td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }\n      table.answer-table tr:nth-child(even) td { background: #f8fafc; }\n      .ans-num { font-weight: 700; color: #0f766e; width: 32px; text-align: center; }\n      .ans-q-en { color: #94a3b8; font-style: italic; font-size: 8pt; margin-top: 2px; }\n      .ans-pill { display: inline-block; background: #0f766e; color: #fff; padding: 2px 8px; border-radius: 3px; font-weight: 600; font-size: 8.5pt; }\n      .ans-correct { background: #059669; }\n      .ans-wrong { background: #dc2626; }\n      .ans-cat { color: #64748b; font-size: 8.5pt; }\n\n      .signature-area { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; page-break-inside: avoid; }\n      .sig-box { text-align: center; font-size: 9pt; }\n      .sig-box .role { color: #64748b; margin-bottom: 60px; }\n      .sig-box .name { border-top: 1px solid #1f2937; padding-top: 4px; font-weight: 600; }\n\n      .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8pt; color: #94a3b8; }\n\n      .page-break { page-break-before: always; }\n      .hidden { display: none; }\n      @media print {\n        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n      }\n    </style></head><body>\n\n    <div class=\"header\">\n      <div class=\"header-left\">\n        <h1>Laporan Hasil Tes Psikologi</h1>\n        <p>Sistem Asesmen Rekrutmen \u2014 Konfidensial</p>\n      </div>\n      <div class=\"header-right\">\n        <div class=\"doc-id\">REF: ").concat(r.id.substring(0, 8).toUpperCase(), "</div>\n        <div class=\"doc-date\">").concat(new Date(r.completed_at).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" }), "</div>\n      </div>\n    </div>\n\n    <div class=\"section\">\n      <div class=\"section-title\">Profil Kandidat</div>\n      <div style=\"display:flex; gap:18px; align-items:flex-start;\">\n        ").concat((profile === null || profile === void 0 ? void 0 : profile.photo_url) ? "<img src=\"".concat(profile.photo_url, "\" alt=\"Foto Kandidat\" style=\"width:110px;height:140px;object-fit:cover;border:2px solid #0f766e;border-radius:6px;background:#f1f5f9;\" />") : "<div style=\"width:110px;height:140px;border:2px dashed #cbd5e1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:8.5pt;text-align:center;padding:8px;\">Foto tidak tersedia</div>", "\n        <div style=\"flex:1;\">\n          <div class=\"profile-grid\">\n            <div class=\"profile-row\"><span class=\"label\">Nama Lengkap</span><span class=\"value\">").concat(r.candidate_name, "</span></div>\n            <div class=\"profile-row\"><span class=\"label\">Posisi Dilamar</span><span class=\"value\">").concat(r.position || "-", "</span></div>\n            <div class=\"profile-row\"><span class=\"label\">Email</span><span class=\"value\">").concat((profile === null || profile === void 0 ? void 0 : profile.email) || "-", "</span></div>\n            <div class=\"profile-row\"><span class=\"label\">No. Telepon</span><span class=\"value\">").concat((profile === null || profile === void 0 ? void 0 : profile.phone) || "-", "</span></div>\n            <div class=\"profile-row\"><span class=\"label\">Tanggal Lahir</span><span class=\"value\">").concat((profile === null || profile === void 0 ? void 0 : profile.birthDate) || "-", "</span></div>\n            <div class=\"profile-row\"><span class=\"label\">Pendidikan</span><span class=\"value\">").concat((profile === null || profile === void 0 ? void 0 : profile.education) || (profile === null || profile === void 0 ? void 0 : profile.education_level) || (profile === null || profile === void 0 ? void 0 : profile.education_institution) || "-", "</span></div>\n            <div class=\"profile-row\"><span class=\"label\">Jenis Kelamin</span><span class=\"value\">").concat((profile === null || profile === void 0 ? void 0 : profile.gender) || "-", "</span></div>\n            <div class=\"profile-row\"><span class=\"label\">Tanggal Tes</span><span class=\"value\">").concat(new Date(r.completed_at).toLocaleDateString("id-ID", { dateStyle: "long" }), "</span></div>\n          </div>\n        </div>\n      </div>\n    </div>\n\n    ").concat((function () {
            // For CFIT, calculate IQ from correct answers
            var cfitIqHtml = '';
            if ((0, cfitScoring_1.isCfitName)(r.test_name)) {
                var iqClassification = {
                    49: { iq: 183, classification: "GENIUS" },
                    48: { iq: 179, classification: "GENIUS" },
                    47: { iq: 176, classification: "GENIUS" },
                    46: { iq: 173, classification: "GENIUS" },
                    45: { iq: 169, classification: "VERY SUPERIOR" },
                    44: { iq: 167, classification: "VERY SUPERIOR" },
                    43: { iq: 165, classification: "VERY SUPERIOR" },
                    42: { iq: 161, classification: "VERY SUPERIOR" },
                    41: { iq: 157, classification: "VERY SUPERIOR" },
                    40: { iq: 155, classification: "VERY SUPERIOR" },
                    39: { iq: 152, classification: "VERY SUPERIOR" },
                    38: { iq: 149, classification: "VERY SUPERIOR" },
                    37: { iq: 145, classification: "VERY SUPERIOR" },
                    36: { iq: 142, classification: "VERY SUPERIOR" },
                    35: { iq: 140, classification: "VERY SUPERIOR" },
                    34: { iq: 137, classification: "SUPERIOR" },
                    33: { iq: 133, classification: "SUPERIOR" },
                    32: { iq: 131, classification: "SUPERIOR" },
                    31: { iq: 128, classification: "SUPERIOR" },
                    30: { iq: 124, classification: "SUPERIOR" },
                    29: { iq: 121, classification: "SUPERIOR" },
                    28: { iq: 119, classification: "HIGH AVERAGE" },
                    27: { iq: 116, classification: "HIGH AVERAGE" },
                    26: { iq: 113, classification: "HIGH AVERAGE" },
                    25: { iq: 109, classification: "AVERAGE" },
                    24: { iq: 106, classification: "AVERAGE" },
                    23: { iq: 103, classification: "AVERAGE" },
                    22: { iq: 100, classification: "AVERAGE" },
                    21: { iq: 96, classification: "AVERAGE" },
                    20: { iq: 94, classification: "AVERAGE" },
                    19: { iq: 91, classification: "AVERAGE" },
                    18: { iq: 88, classification: "LOW AVERAGE" },
                    17: { iq: 85, classification: "LOW AVERAGE" },
                    16: { iq: 81, classification: "LOW AVERAGE" },
                    15: { iq: 78, classification: "BOEDERLINE MENTAL RETARDATION" },
                    14: { iq: 75, classification: "BOEDERLINE MENTAL RETARDATION" },
                    13: { iq: 72, classification: "BOEDERLINE MENTAL RETARDATION" },
                    12: { iq: 70, classification: "BOEDERLINE MENTAL RETARDATION" },
                    11: { iq: 67, classification: "MILD MENTAL RETARDATION" },
                    10: { iq: 65, classification: "MILD MENTAL RETARDATION" },
                    9: { iq: 60, classification: "MILD MENTAL RETARDATION" },
                    8: { iq: 57, classification: "MILD MENTAL RETARDATION" },
                    7: { iq: 55, classification: "MILD MENTAL RETARDATION" },
                    6: { iq: 52, classification: "MILD MENTAL RETARDATION" },
                    5: { iq: 48, classification: "MODERATE MENTAL RETARDATION" },
                    4: { iq: 47, classification: "MODERATE MENTAL RETARDATION" },
                    3: { iq: 45, classification: "MODERATE MENTAL RETARDATION" },
                    2: { iq: 43, classification: "MODERATE MENTAL RETARDATION" },
                    1: { iq: 40, classification: "MODERATE MENTAL RETARDATION" },
                    0: { iq: 38, classification: "MODERATE MENTAL RETARDATION" }
                };
                var iqInfo = (0, cfitScoring_1.getCfitIqInfoFromResult)(r);
                cfitIqHtml = "\n          <div class=\"score-cards\">\n            <div class=\"score-card\"><div class=\"label\">Alat Tes</div><div class=\"value\" style=\"font-size:13pt;margin-top:8px;\">".concat(r.test_name, "</div></div>\n            <div class=\"score-card\"><div class=\"label\">IQ Score</div><div class=\"value\">").concat(iqInfo.iq, "</div></div>\n            <div class=\"score-card\"><div class=\"label\">Klasifikasi</div><div class=\"value\" style=\"font-size:13pt;margin-top:8px;\">").concat(iqInfo.classification, "</div></div>\n          </div>\n          <p style=\"text-align:center;font-size:9pt;color:#64748b;margin-top:8px;\">Raw Score: ").concat(iqInfo.raw, " / ").concat(iqInfo.max, "</p>\n        ");
            }
            return cfitIqHtml;
        })(), "\n    ").concat(!(0, cfitScoring_1.isCfitName)(r.test_name) && !isPapiResult(r) ? (function () {
            var isPP = r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus");
            var isIST = isIstResult(r);
            var isAptitude = isAptitudeResult(r);
            var dominantScore = '';
            if (isPP) {
                var ppMap_1 = {
                    K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
                    S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
                    M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
                    P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
                };
                var norm_1 = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
                Object.entries(cats).forEach(function (_a) {
                    var k = _a[0], v = _a[1];
                    var n = ppMap_1[k] || k;
                    if (n in norm_1)
                        norm_1[n] += Number(v) || 0;
                });
                var sorted = Object.entries(norm_1).sort(function (a, b) { return b[1] - a[1]; });
                var dominant = sorted[0];
                var second = sorted[1];
                var diff = dominant[1] - second[1];
                if (diff >= 1 && diff <= 4) {
                    dominantScore = "".concat(dominant[0], " (").concat(dominant[1], ") / ").concat(second[0], " (").concat(second[1], ")");
                }
                else {
                    dominantScore = "".concat(dominant[0], " (").concat(dominant[1], ")");
                }
            }
            var istSummary = isIST ? getIstSummary(cats, r.score) : null;
            var mbtiSummary = isMbtiResult(r) ? getMbtiSummary(cats) : null;
            var aptitudeInfo = isAptitude ? getAptitudeScoreInfo(scoreResult) : null;
            return "\n    <div class=\"section\">\n      <div class=\"section-title\">Ringkasan Hasil - ".concat(r.test_name, "</div>\n      <div class=\"score-cards\">\n        <div class=\"score-card\"><div class=\"label\">Alat Tes</div><div class=\"value\" style=\"font-size:13pt;margin-top:8px;\">").concat(r.test_name, "</div></div>\n        <div class=\"score-card\"><div class=\"label\">").concat(isPP ? 'Hasil Dominan' : isIST ? 'Skor IST' : mbtiSummary ? 'Tipe MBTI' : isAptitude ? 'Skor Akhir IQ' : 'Skor Akhir', "</div>\n        <div class=\"value\" style=\"").concat(isPP ? 'font-size:18pt;font-weight:800;color:#f472b6;' : mbtiSummary ? 'letter-spacing:3px;' : isAptitude ? 'font-size:24pt;color:#0f766e;' : '', "\">").concat(isPP ? dominantScore : isIST ? "".concat(istSummary === null || istSummary === void 0 ? void 0 : istSummary.score, "<span style=\"font-size:14pt;color:#64748b;\">%</span><div style=\"font-size:9pt;color:#64748b;margin-top:4px;\">Raw ").concat(istSummary === null || istSummary === void 0 ? void 0 : istSummary.raw, "/").concat(istSummary === null || istSummary === void 0 ? void 0 : istSummary.max, "</div>") : mbtiSummary ? mbtiSummary.type : isAptitude ? "".concat(aptitudeInfo === null || aptitudeInfo === void 0 ? void 0 : aptitudeInfo.iq, "<div style=\"font-size:9pt;color:#64748b;margin-top:4px;\">").concat(aptitudeInfo === null || aptitudeInfo === void 0 ? void 0 : aptitudeInfo.classification, "</div>") : "".concat(r.score, "<span style=\"font-size:14pt;color:#64748b;\">%</span>"), "</div></div>\n        <div class=\"score-card\"><div class=\"label\">Soal Dijawab</div><div class=\"value\">").concat(r.answered_questions, "<span style=\"font-size:14pt;color:#64748b;\">/").concat(r.total_questions, "</span></div></div>\n      </div>\n    </div>\n    ");
        })() : '', "\n\n    ").concat(discChartsHTML, "\n\n    ").concat(istProfileHTML, "\n    ").concat(mbtiProfileHTML, "\n    ").concat(kraepelinProfileHTML, "\n    ").concat(papiProfileHTML, "\n    ").concat(aptitudeProfileHTML, "\n    ").concat(msdtProfileHTML, "\n\n    <div class=\"section ").concat(r.test_name.toUpperCase().includes("DISC") || isIstResult(r) || isMbtiResult(r) || isKraepelinResult(r) || isPapiResult(r) || isAptitudeResult(r) ? "hidden" : "", "\">\n      <div class=\"section-title\">Profil Dimensi & Skor</div>\n      ").concat(r.test_name.toUpperCase().includes("DISC") ?
            // For DISC, show horizontal bar chart with 0 in center, fixed order D, I, S, C
            (function () {
                var dims = DISC_DIMS;
                var discRows = buildDiscRows(cats, r.total_questions || 24);
                var sortedCats = __spreadArray([], discRows, true).sort(function (a, b) { return b.net - a.net; });
                var top2 = sortedCats.slice(0, 2);
                return "\n            <div style=\"background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 16px; margin-bottom: 16px;\">\n              <p style=\"font-size: 10pt; font-weight: 700; color: #0f766e; margin-bottom: 8px;\">Kategori Dominan DISC</p>\n              <div style=\"display: flex; gap: 16px; justify-content: center;\">\n                ".concat(top2.map(function (_a, i) {
                    var dim = _a.dim, net = _a.net;
                    return "\n                  <div style=\"text-align: center; flex: 1;\">\n                    <div style=\"font-size: 24pt; font-weight: 800; color: #0f766e; margin-bottom: 4px;\">".concat(dim, "</div>\n                    <div style=\"font-size: 12pt; color: #475569;\">Skor: ").concat(net > 0 ? '+' : '').concat(net, "</div>\n                    <div style=\"font-size: 10pt; color: #64748b; margin-top: 2px;\">").concat(i === 0 ? 'Dominan Utama' : 'Dominan Sekunder', "</div>\n                  </div>\n                ");
                }).join(''), "\n              </div>\n            </div>\n            <div style=\"margin-bottom: 16px;\">\n              <p style=\"font-size: 10pt; font-weight: 700; color: #374151; margin-bottom: 12px;\">Detail Skor per Dimensi</p>\n              ").concat(dims.map(function (dim) {
                    var val = getDiscValue(cats, dim, "N");
                    var maxVal = Math.max.apply(Math, __spreadArray(__spreadArray([], discRows.map(function (row) { return Math.abs(row.net); }), false), [1], false));
                    var barWidth = (Math.abs(val) / maxVal) * 40;
                    var isPositive = val >= 0;
                    return "\n                  <div style=\"display: flex; align-items: center; gap: 12px; margin-bottom: 12px;\">\n                    <span style=\"width: 32px; text-align: right; font-weight: 700; color: #374151; font-size: 10pt;\">".concat(dim, "</span>\n                    <div style=\"flex: 1; position: relative; height: 32px; display: flex; align-items: center;\">\n                      <!-- Zero line -->\n                      <div style=\"position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: #9ca3af;\"></div>\n                      <!-- Negative bar (left side) -->\n                      ").concat(!isPositive ? "<div style=\"position: absolute; right: 50%; height: 24px; background: #f87171; border-radius: 4px 0 0 4px; width: ".concat(barWidth, "%; margin-right: -1px;\"></div>") : '', "\n                      <!-- Positive bar (right side) -->\n                      ").concat(isPositive ? "<div style=\"position: absolute; left: 50%; height: 24px; background: #34d399; border-radius: 0 4px 4px 0; width: ".concat(barWidth, "%; margin-left: 1px;\"></div>") : '', "\n                      <!-- Value label -->\n                      <span style=\"position: absolute; font-size: 9pt; font-weight: 700; ").concat(isPositive ? 'left: 50%; margin-left: 8px; color: #059669;' : 'right: 50%; margin-right: 8px; color: #dc2626;', "\">").concat(val, "</span>\n                    </div>\n                  </div>\n                ");
                }).join(''), "\n              <div style=\"display: flex; align-items: center; justify-content: center; gap: 24px; margin-top: 16px; font-size: 9pt; color: #6b7280;\">\n                <span style=\"display: flex; align-items: center; gap: 4px;\"><div style=\"width: 12px; height: 12px; background: #f87171; border-radius: 2px;\"></div> Negatif</span>\n                <div style=\"width: 1px; height: 16px; background: #d1d5db;\"></div>\n                <span style=\"display: flex; align-items: center; gap: 4px;\"><div style=\"width: 12px; height: 12px; background: #34d399; border-radius: 2px;\"></div> Positif</span>\n              </div>\n            </div>\n          ");
            })()
            : r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus") ? (function () {
                // Personality Plus format
                var ppMap = {
                    K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
                    S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
                    M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
                    P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
                };
                var norm = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
                Object.entries(cats).forEach(function (_a) {
                    var k = _a[0], v = _a[1];
                    var n = ppMap[k] || k;
                    if (n in norm)
                        norm[n] += Number(v) || 0;
                });
                var total = Object.values(norm).reduce(function (a, b) { return a + b; }, 0) || r.total_questions || 40;
                var order = ['Sanguinis', 'Koleris', 'Melankolis', 'Plegmatis'];
                var colors = { Sanguinis: '#f59e0b', Koleris: '#dc2626', Melankolis: '#2563eb', Plegmatis: '#059669' };
                // Calculate percentages for chart
                var chartData = order.map(function (t) { return ({ name: t, value: norm[t], pct: Math.round((norm[t] / total) * 100) }); });
                var maxVal = Math.max.apply(Math, __spreadArray(__spreadArray([], chartData.map(function (d) { return d.value; }), false), [1], false));
                return "\n        <!-- Compact Table + Chart Side by Side -->\n        <div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;\">\n          <!-- Tabel Kiri -->\n          <div>\n            <p style=\"font-size: 9pt; font-weight: 700; color: #374151; margin-bottom: 6px;\">Detail Skor per Dimensi</p>\n            <table style=\"width:100%; border-collapse: collapse; font-size: 8pt;\">\n              <thead>\n                <tr style=\"background: #f1f5f9;\">\n                  <th style=\"padding: 4px 6px; text-align: left; border: 1px solid #cbd5e1; font-weight: 600;\">Temperamen</th>\n                  <th style=\"padding: 4px 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;\">Jumlah</th>\n                  <th style=\"padding: 4px 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;\">%</th>\n                </tr>\n              </thead>\n              <tbody>\n                ".concat(chartData.map(function (d) { return "\n                  <tr>\n                    <td style=\"padding: 4px 6px; border: 1px solid #e2e8f0; font-weight: 600; color: ".concat(colors[d.name], "\">").concat(d.name, "</td>\n                    <td style=\"padding: 4px 6px; border: 1px solid #e2e8f0; text-align: center;\">").concat(d.value, "</td>\n                    <td style=\"padding: 4px 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700;\">").concat(d.pct, "%</td>\n                  </tr>\n                "); }).join(''), "\n              </tbody>\n            </table>\n            <div style=\"margin-top: 8px; font-size: 8pt; color: #64748b; background: #f8fafc; padding: 6px; border-radius: 4px;\">\n              <strong>Dominan:</strong> ").concat(chartData[0].name, " (").concat(chartData[0].pct, "%)<br/>\n              <strong>Sekunder:</strong> ").concat(chartData[1].name, " (").concat(chartData[1].pct, "%)\n            </div>\n          </div>\n          \n          <!-- Grafik Kanan -->\n          <div style=\"border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; background: #f8fafc;\">\n            <p style=\"font-size: 8pt; font-weight: 700; color: #374151; margin-bottom: 4px; text-align: center;\">Grafik 4 Temperamen</p>\n            <svg width=\"100%\" height=\"140\" viewBox=\"0 0 200 140\">\n              <!-- Y axis -->\n              <line x1=\"25\" y1=\"10\" x2=\"25\" y2=\"110\" stroke=\"#374151\" stroke-width=\"1\"/>\n              <line x1=\"25\" y1=\"110\" x2=\"190\" y2=\"110\" stroke=\"#374151\" stroke-width=\"1\"/>\n              <!-- Y axis labels -->\n              <text x=\"22\" y=\"115\" text-anchor=\"end\" font-size=\"7\" fill=\"#6b7280\">0</text>\n              <text x=\"22\" y=\"85\" text-anchor=\"end\" font-size=\"7\" fill=\"#6b7280\">").concat(Math.round(maxVal * 0.5), "</text>\n              <text x=\"22\" y=\"55\" text-anchor=\"end\" font-size=\"7\" fill=\"#6b7280\">").concat(Math.round(maxVal * 0.75), "</text>\n              <text x=\"22\" y=\"15\" text-anchor=\"end\" font-size=\"7\" fill=\"#6b7280\">").concat(maxVal, "</text>\n              <!-- Bars -->\n              ").concat(chartData.map(function (d, i) {
                    var barHeight = (d.value / maxVal) * 100;
                    var x = 30 + (i * 40);
                    return "\n                  <rect x=\"".concat(x, "\" y=\"").concat(110 - barHeight, "\" width=\"32\" height=\"").concat(barHeight, "\" fill=\"").concat(colors[d.name], "\" rx=\"2\" opacity=\"0.85\"/>\n                  <text x=\"").concat(x + 16, "\" y=\"").concat(105 - barHeight, "\" text-anchor=\"middle\" font-size=\"8\" font-weight=\"700\" fill=\"#374151\">").concat(d.value, "</text>\n                  <text x=\"").concat(x + 16, "\" y=\"").concat(125, "\" text-anchor=\"middle\" font-size=\"7\" font-weight=\"600\" fill=\"#374151\">").concat(d.name.substring(0, 3), "</text>\n                ");
                }).join(''), "\n            </svg>\n          </div>\n        </div>\n        ");
            })()
                : (0, cfitScoring_1.isCfitName)(r.test_name) ? "\n        <table class=\"dim-table\">\n          <thead><tr><th style=\"width:35%\">Aspek</th><th style=\"width:20%\">Nilai</th><th>Keterangan</th></tr></thead>\n          <tbody>\n            ".concat(cfitProfileRows.map(function (row) { return "<tr>\n              <td><strong>".concat(row.label, "</strong></td>\n              <td>").concat(row.value, "</td>\n              <td>").concat(row.note, "</td>\n            </tr>"); }).join(""), "\n          </tbody>\n        </table>\n      ")
                    : "\n        <table class=\"dim-table\">\n          <thead><tr><th style=\"width:35%\">Dimensi / Aspek</th><th style=\"width:15%\">Skor</th><th>Indikator Visual</th></tr></thead>\n          <tbody>\n            ".concat(catEntries.map(function (_a) {
                        var dim = _a[0], val = _a[1];
                        var pct = (val / maxVal) * 100;
                        return "<tr>\n                <td><strong>".concat(dim, "</strong></td>\n                <td>").concat(val).concat(r.test_name === "PAPIKOSTIK" ? "/9" : "%", "</td>\n                <td><div class=\"bar-container\"><div class=\"bar-fill\" style=\"width:").concat(pct, "%; background:").concat(pct >= 70 ? '#059669' : pct >= 40 ? '#d97706' : '#dc2626', ";\"></div></div></td>\n              </tr>");
                    }).join(""), "\n          </tbody>\n        </table>\n      "), "\n    </div>\n\n    ").concat(discInterpretation, "\n\n    ").concat((function () {
            var isPP = r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus");
            var isDISC = r.test_name.toUpperCase().includes("DISC");
            if (isDISC)
                return "";
            if (isIstResult(r))
                return istInterpretationHTML;
            if (specialInterpretationHTML)
                return specialInterpretationHTML;
            // Full format interpretation for PP
            if (isPP) {
                return "<div class=\"section\"><div class=\"section-title\">Interpretasi Psikolog \u2014 Profil 4 Temperamen</div><div class=\"interpretation\">".concat(formatPapiInterpretationHtml((0, personalityPlusScoring_1.buildPersonalityPlusInterpretation)(cats, r.total_questions || 40)), "</div></div>");
                var ppMap_2 = {
                    K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
                    S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
                    M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
                    P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
                };
                var norm_2 = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
                Object.entries(cats).forEach(function (_a) {
                    var k = _a[0], v = _a[1];
                    var n = ppMap_2[k] || k;
                    if (n in norm_2)
                        norm_2[n] += Number(v) || 0;
                });
                var sorted = Object.entries(norm_2).sort(function (a, b) { return b[1] - a[1]; });
                var _a = sorted[0], dom = _a[0], domVal = _a[1];
                var _b = sorted[1], sec = _b[0], secVal = _b[1];
                var total = Object.values(norm_2).reduce(function (a, b) { return a + b; }, 0) || 1;
                var domPct = Math.round((domVal / total) * 100);
                var secPct = Math.round((secVal / total) * 100);
                var strengths = {
                    Sanguinis: 'Ekspresif, antusias, ramah, mudah bergaul, optimis, kreatif, dan mampu memotivasi orang lain. Cocok di lingkungan yang membutuhkan komunikasi intensif.',
                    Koleris: 'Tegas, berorientasi pada hasil, pemimpin alami, mandiri, cepat mengambil keputusan, dan tidak takut tantangan.',
                    Melankolis: 'Analitis, teliti, perfeksionis, terstruktur, dan berorientasi pada kualitas.',
                    Plegmatis: 'Tenang, sabar, konsisten, pendukung tim, dan mampu menjaga stabilitas.'
                };
                var weaknesses = {
                    Sanguinis: 'Cenderung impulsif, kurang disiplin pada detail, mudah teralihkan, dan kadang sulit menyelesaikan tugas yang berulang/monoton.',
                    Koleris: 'Cenderung dominan, kurang sabar, bisa terkesan keras kepala, dan kadang mengabaikan perasaan orang lain.',
                    Melankolis: 'Cenderung perfeksionis, moody, sulit move on dari kesalahan, dan bisa terlalu kritis.',
                    Plegmatis: 'Cenderung lambat dalam mengambil inisiatif, sulit menolak, dan bisa terlalu menghindari konflik.'
                };
                var recommendations = {
                    Sanguinis: 'Marketing, Public Relations, Sales, Trainer, Customer Engagement, Event Organizer',
                    Koleris: 'Manager, Entrepreneur, Sales Director, Project Leader, Business Development',
                    Melankolis: 'Analyst, Quality Control, Researcher, Programmer, Accountant',
                    Plegmatis: 'Customer Service, HR, Administrator, Counselor, Therapist'
                };
                var secDesc = {
                    Koleris: 'tegas, berorientasi pada hasil, pemimpin alami, mandiri, cepat mengambil keputusan, dan tidak takut tantangan',
                    Sanguinis: 'ekspresif, antusias, ramah, dan mampu memotivasi orang lain',
                    Melankolis: 'analitis, teliti, dan berorientasi pada kualitas',
                    Plegmatis: 'tenang, sabar, dan pendukung tim'
                };
                return "\n    <div class=\"section\">\n      <div class=\"section-title\">Interpretasi Psikolog \u2014 Profil 4 Temperamen</div>\n      <div style=\"background: #fefce8; border-left: 4px solid #eab308; padding: 12px; border-radius: 0 8px 8px 0; font-size: 9.5pt; line-height: 1.6; color: #422006;\">\n        <p style=\"margin-bottom: 10px;\">Berdasarkan hasil tes Personality Plus, kandidat menampilkan profil temperamen <strong>DOMINAN: ".concat(dom, "</strong> (").concat(domVal, " jawaban \u2014 ").concat(domPct, "%) dengan dukungan <strong>SEKUNDER: ").concat(sec, "</strong> (").concat(secVal, " jawaban \u2014 ").concat(secPct, "%). Distribusi jumlah jawaban \u2014 Sanguinis: ").concat(norm_2.Sanguinis, ", Koleris: ").concat(norm_2.Koleris, ", Melankolis: ").concat(norm_2.Melankolis, ", Plegmatis: ").concat(norm_2.Plegmatis, ".</p>\n        \n        <p style=\"margin-bottom: 6px; font-weight: 700; color: #0f766e;\">KEKUATAN (").concat(dom, "):</p>\n        <p style=\"margin-bottom: 10px; padding-left: 12px;\">").concat(strengths[dom], "</p>\n        \n        <p style=\"margin-bottom: 6px; font-weight: 700; color: #dc2626;\">AREA PERHATIAN (").concat(dom, "):</p>\n        <p style=\"margin-bottom: 10px; padding-left: 12px;\">").concat(weaknesses[dom], "</p>\n        \n        <p style=\"margin-bottom: 10px;\"><strong>Kombinasi ").concat(dom, "-").concat(sec, ":</strong> kandidat memiliki karakter utama ").concat(dom.toLowerCase(), " yang dilengkapi nuansa ").concat(sec.toLowerCase(), " (").concat(secDesc[sec], "). Kombinasi ini memperkaya profil dan memperluas zona efektivitas kerja.</p>\n        \n        <p style=\"margin-bottom: 10px;\"><strong>REKOMENDASI POSISI:</strong> ").concat(recommendations[dom], ".</p>\n        \n        <p style=\"font-size: 8.5pt; color: #64748b; border-top: 1px dashed #d1d5db; padding-top: 8px; margin-top: 10px;\"><strong>CATATAN PSIKOLOG:</strong> Profil ini valid untuk ").concat(total, " item respons. Disarankan didampingi wawancara mendalam (kompetensi & nilai) untuk validasi konteks pekerjaan. Skor tertinggi adalah karakter natural; tidak menutup kemungkinan kandidat menampilkan perilaku temperamen lain situasionalnya.</p>\n      </div>\n    </div>");
            }
            // For other tests
            if (!r.interpretation)
                return "";
            return "\n    <div class=\"section\">\n      <div class=\"section-title\">Interpretasi Psikolog</div>\n      <div class=\"interpretation\" style=\"white-space:pre-line;\">".concat(r.interpretation.replace(/</g, '&lt;'), "</div>\n    </div>");
        })(), "\n\n    <div class=\"section page-break\">\n      <div class=\"section-title\">Lembar Jawaban Kandidat (").concat(answers.length, " Soal)</div>\n      ").concat(answers.length === 0 ? '<p style="color:#94a3b8;font-style:italic;padding:12px 0;">Belum ada data jawaban tersimpan.</p>' : "\n      <table class=\"answer-table\">\n        <thead><tr><th style=\"width:36px;\">No</th><th>Pertanyaan</th><th style=\"width:180px;\">Jawaban</th><th style=\"width:120px;\">Kategori</th></tr></thead>\n        <tbody>\n          ".concat(answers.map(function (a) {
            var _a;
            var ppMap = { K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris', S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis', M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis', P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis' };
            var categoryDisplay = a.category || "-";
            if ((r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus")) && a.category) {
                categoryDisplay = ppMap[a.category] || a.category;
            }
            else if (r.test_name.toUpperCase().includes("DISC") && ((_a = a.selected_answer) === null || _a === void 0 ? void 0 : _a.includes("PALING")) && a.selected_answer_label) {
                categoryDisplay = a.selected_answer_label;
            }
            else if (isPapiResult(r) && a.category) {
                categoryDisplay = PAPI_LABELS[a.category] ? "".concat(a.category, " - ").concat(PAPI_LABELS[a.category]) : a.category;
            }
            return "\n            <tr>\n              <td class=\"ans-num\">".concat(a.question_number, "</td>\n              <td>\n                <div>").concat(a.question_text, "</div>\n                ").concat(a.question_text_en ? "<div class=\"ans-q-en\">".concat(a.question_text_en, "</div>") : "", "\n              </td>\n              <td><span class=\"ans-pill ").concat(a.is_correct === true ? 'ans-correct' : a.is_correct === false ? 'ans-wrong' : '', "\">").concat(getAnswerDisplayText(a, !r.test_name.toUpperCase().includes("DISC")), "</span></td>\n              <td class=\"ans-cat\">").concat(categoryDisplay, "</td>\n            </tr>");
        }).join(""), "\n        </tbody>\n      </table>"), "\n    </div>\n\n    <div class=\"signature-area\">\n      <div class=\"sig-box\">\n        <div class=\"role\">Kandidat</div>\n        <div class=\"name\">").concat(r.candidate_name, "</div>\n      </div>\n      <div class=\"sig-box\">\n        <div class=\"role\">Psikolog Penilai</div>\n        <div class=\"name\">________________________</div>\n      </div>\n    </div>\n\n    <div class=\"footer\">\n      Dokumen ini dihasilkan secara otomatis oleh PsyTest Recruitment Platform \u2014 Bersifat Konfidensial.<br/>\n      Dicetak pada: ").concat(new Date().toLocaleString("id-ID"), "\n    </div>\n\n    </body></html>");
        var win = window.open("", "_blank");
        if (!win)
            return;
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(function () { return win.print(); }, 300);
    };
    var handleExport = function () {
        var csv = __spreadArray([
            "Nama,Posisi,Tes,Kesimpulan,Dijawab,Total,Tanggal,Status"
        ], results.map(function (r) {
            var status = getResultStatusBadge(r);
            return [
                r.candidate_name,
                r.position,
                r.test_name,
                getResultConclusion(r, answersByResult[r.id] || []),
                r.answered_questions,
                r.total_questions,
                r.completed_at,
                status.label,
            ].map(escapeCsv).join(",");
        }), true).join("\n");
        var blob = new Blob([csv], { type: "text/csv" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "hasil-tes-psikologi.csv";
        a.click();
        URL.revokeObjectURL(url);
    };
    var renderChart = function (r) {
        var cats = isPapiResult(r)
            ? getEffectivePapiCategories(r, answers)
            : isAptitudeResult(r)
                ? getEffectiveAptitudeCategories(r, answers)
                : r.categories;
        var data = Object.entries(cats)
            .filter(function (_a) {
            var value = _a[1];
            return typeof value === "number";
        })
            .map(function (_a) {
            var name = _a[0], value = _a[1];
            return ({ name: name, value: value });
        });
        // DISC: render Mask/Core/Mirror as bar charts + final Line chart trend + Radar (Spider)
        if (r.test_name.toUpperCase().includes("DISC")) {
            var dims = ["D", "I", "S", "C"];
            var dimMap_1 = { D: "Dominance", I: "Influence", S: "Steadiness", C: "Compliance" };
            var reverseDimMap = { Dominance: "D", Influence: "I", Steadiness: "S", Compliance: "C" };
            // Check if using old format (D, I, S, C) or new format (full names)
            var useOldFormat_1 = cats["D"] !== undefined || cats["I"] !== undefined || cats["S"] !== undefined || cats["C"] !== undefined;
            // Helper to get M value
            var getM = function (d) {
                if (useOldFormat_1) {
                    return cats["".concat(d, "_M")] !== undefined ? Number(cats["".concat(d, "_M")]) : 0;
                }
                else {
                    var fullName = dimMap_1[d];
                    return cats["".concat(fullName, "_M")] !== undefined ? Number(cats["".concat(fullName, "_M")]) : 0;
                }
            };
            // Helper to get L value  
            var getL = function (d) {
                if (useOldFormat_1) {
                    return cats["".concat(d, "_L")] !== undefined ? Number(cats["".concat(d, "_L")]) : 0;
                }
                else {
                    var fullName = dimMap_1[d];
                    return cats["".concat(fullName, "_L")] !== undefined ? Number(cats["".concat(fullName, "_L")]) : 0;
                }
            };
            // Helper to get Net value
            var getN_1 = function (d) {
                if (useOldFormat_1) {
                    return Number(cats[d] || 0);
                }
                else {
                    var fullName = dimMap_1[d];
                    return Number(cats[fullName] || 0);
                }
            };
            var M_1 = getM;
            var L_1 = getL;
            var N_1 = getN_1;
            var mask = dims.map(function (d) { return ({ name: d, value: M_1(d) }); });
            var core = dims.map(function (d) { return ({ name: d, value: L_1(d) }); });
            var mirror = dims.map(function (d) { return ({ name: d, value: N_1(d) }); });
            var jobMatch = {
                D: "Manager, Entrepreneur, Sales Director, Director, CEO",
                I: "Sales, Public Relations, Marketing, Trainer, Public Speaker",
                S: "Counselor, Teacher, Nurse, HR, Customer Service, Therapist",
                C: "Accountant, Engineer, Analyst, Researcher, Quality Control, Programmer",
            };
            var renderMini = function (title, d, color, allowNeg) {
                if (allowNeg === void 0) { allowNeg = false; }
                var vals = d.map(function (x) { return x.value; });
                var yMin = allowNeg ? Math.min.apply(Math, __spreadArray([0], vals, false)) : 0;
                var yMax = Math.max.apply(Math, __spreadArray([1], vals.map(Math.abs), false));
                return (<div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-foreground mb-2">{title}</p>
            <recharts_1.ResponsiveContainer width="100%" height={180}>
              <recharts_1.AreaChart data={d}>
                <defs>
                  <linearGradient id={"gradient-".concat(color.replace('#', ''))} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)"/>
                <recharts_1.XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11 }}/>
                <recharts_1.YAxis domain={[yMin, yMax]} allowDecimals={false} tick={{ fill: "hsl(210,20%,70%)", fontSize: 10 }}/>
                <recharts_1.Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }}/>
                <recharts_1.Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fill={"url(#gradient-".concat(color.replace('#', ''), ")")} dot={{ r: 5, fill: color, strokeWidth: 2 }} activeDot={{ r: 7, fill: color, strokeWidth: 2 }}/>
              </recharts_1.AreaChart>
            </recharts_1.ResponsiveContainer>
          </div>);
            };
            var sortedCats = dims.map(function (d) { return [d, getN_1(d)]; }).sort(function (a, b) { return b[1] - a[1]; });
            var dominant = sortedCats[0][0];
            var secondary = sortedCats[1][0];
            return (<div className="space-y-4">
          <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 to-primary/5 p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Kategori Dominan DISC</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-primary">{dominant}</span>
              <span className="text-2xl text-muted-foreground/50">&</span>
              <span className="text-2xl font-semibold text-primary/80">{secondary}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {dominant === 'D' && 'Dominance - Pemimpin yang tegas dan berorientasi hasil'}
              {dominant === 'I' && 'Influence - Komunikator yang persuasif dan energik'}
              {dominant === 'S' && 'Steadiness - Pendukung yang stabil dan sabar'}
              {dominant === 'C' && 'Conscientiousness - Analitis yang teliti dan akurat'}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {renderMini("Mask — Public Self (Most)", mask, "#10b981")}
            {renderMini("Core — Private Self (Least)", core, "#f59e0b")}
            {renderMini("Mirror — Perceived Self (Net = M − L)", mirror, "#ec4899", true)}
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-primary mb-3">Interpretasi Profil DISC</p>
            <div className="space-y-2 text-xs leading-relaxed text-muted-foreground [&_.papi-interpretation-heading]:mt-3 [&_.papi-interpretation-heading:first-child]:mt-0 [&_.papi-interpretation-heading]:text-[11px] [&_.papi-interpretation-heading]:font-bold [&_.papi-interpretation-heading]:uppercase [&_.papi-interpretation-heading]:tracking-wide [&_.papi-interpretation-heading]:text-primary [&_.papi-interpretation-list]:ml-5 [&_.papi-interpretation-list]:list-disc [&_.papi-interpretation-list_li]:my-1 [&_.papi-interpretation-paragraph]:my-1" dangerouslySetInnerHTML={{ __html: formatPapiInterpretationHtml((0, discScoring_1.buildDiscInterpretation)(cats, r.total_questions || 24)) }}/>
          </div>
        </div>);
        }
        if (isIstResult(r)) {
            var summary = getIstSummary(cats, r.score);
            var chartData = summary.rows.map(function (row) { return ({ name: row.code, value: row.pct, raw: row.raw, max: row.max, fullName: row.name }); });
            return (<div className="space-y-4">
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-4">
            <div className="grid gap-3 sm:grid-cols-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Skor Mentah</p>
                <p className="text-2xl font-bold text-foreground">{summary.raw}/{summary.max}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Skor Akhir</p>
                <p className="text-2xl font-bold text-primary">{summary.score}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kekuatan Relatif</p>
                <p className="text-lg font-semibold text-foreground">{summary.strongest.code}</p>
              </div>
            </div>
          </div>
          <recharts_1.ResponsiveContainer width="100%" height={300}>
            <recharts_1.BarChart data={chartData}>
              <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)"/>
              <recharts_1.XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11 }}/>
              <recharts_1.YAxis domain={[0, 100]} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }}/>
              <recharts_1.Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} formatter={function (v, _name, props) { return ["".concat(v, "% (").concat(props.payload.raw, "/").concat(props.payload.max, ")"), props.payload.fullName]; }}/>
              <recharts_1.Bar dataKey="value" fill="#2dd4bf" radius={[4, 4, 0, 0]}/>
            </recharts_1.BarChart>
          </recharts_1.ResponsiveContainer>
        </div>);
        }
        if (isMbtiResult(r)) {
            var summary = getMbtiSummary(cats);
            var chartData = summary.rows.flatMap(function (row) { return [
                { name: row.a, value: row.av, pair: row.pair },
                { name: row.b, value: row.bv, pair: row.pair },
            ]; });
            return (<div className="space-y-4">
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-center">
            <p className="text-xs text-muted-foreground">Tipe MBTI</p>
            <p className="text-4xl font-extrabold text-primary tracking-widest">{summary.type}</p>
          </div>
          <recharts_1.ResponsiveContainer width="100%" height={280}>
            <recharts_1.BarChart data={chartData}>
              <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)"/>
              <recharts_1.XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 12 }}/>
              <recharts_1.YAxis allowDecimals={false} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }}/>
              <recharts_1.Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }}/>
              <recharts_1.Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]}/>
            </recharts_1.BarChart>
          </recharts_1.ResponsiveContainer>
        </div>);
        }
        if (isKraepelinResult(r)) {
            var kraepelinData = getKraepelinRows(cats);
            return (<recharts_1.ResponsiveContainer width="100%" height={280}>
          <recharts_1.RadarChart data={kraepelinData}>
            <recharts_1.PolarGrid stroke="hsl(220, 14%, 25%)"/>
            <recharts_1.PolarAngleAxis dataKey="label" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11 }}/>
            <recharts_1.PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(210,20%,60%)", fontSize: 10 }}/>
            <recharts_1.Radar name={r.test_name} dataKey="value" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.25} strokeWidth={2}/>
          </recharts_1.RadarChart>
        </recharts_1.ResponsiveContainer>);
        }
        if (r.test_name === "Personality Plus" || r.test_name.includes("Personality Plus")) {
            // Map semua varian (kode 1-huruf, EN, ID) ke nama temperamen Indonesia
            var ppMap_3 = {
                K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
                S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
                M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
                P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
            };
            var order = ['Sanguinis', 'Koleris', 'Melankolis', 'Plegmatis'];
            var valueByName_1 = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
            data.forEach(function (d) { var k = ppMap_3[d.name] || d.name; if (k in valueByName_1)
                valueByName_1[k] += d.value; });
            var mappedData = order.map(function (n) { return ({ name: n, value: valueByName_1[n] || 0 }); });
            // Skala Y maksimum = total soal (max teoritis jika kandidat memilih dimensi sama setiap soal)
            var yMax = Math.max(10, r.total_questions || 40);
            return (<recharts_1.ResponsiveContainer width="100%" height={300}>
          <recharts_1.LineChart data={mappedData} margin={{ left: 20, right: 30, top: 20, bottom: 30 }}>
            <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)"/>
            <recharts_1.XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 12, fontWeight: 600 }}/>
            <recharts_1.YAxis domain={[0, yMax]} allowDecimals={false} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }} label={{ value: 'Jumlah Jawaban', angle: -90, position: 'insideLeft', fill: 'hsl(210,20%,60%)', fontSize: 11 }}/>
            <recharts_1.Tooltip formatter={function (v) { return ["".concat(v, " jawaban"), 'Skor']; }} contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }}/>
            <recharts_1.Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} dot={{ fill: '#2dd4bf', r: 6, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} label={{ position: 'top', fill: '#2dd4bf', fontSize: 12, fontWeight: 700 }}/>
          </recharts_1.LineChart>
        </recharts_1.ResponsiveContainer>);
        }
        if (isPapiResult(r)) {
            var rows = (0, papiScoring_1.getPapiRows)(cats);
            return (<div className="mx-auto max-w-[560px] [&_.papi-wheel-card]:border [&_.papi-wheel-card]:border-border [&_.papi-wheel-card]:rounded-xl [&_.papi-wheel-card]:bg-background [&_.papi-wheel-card]:p-2 [&_.papi-wheel-card_svg]:max-h-[460px] [&_.papi-wheel-summary]:mt-2 [&_.papi-wheel-summary]:border-t [&_.papi-wheel-summary]:border-border [&_.papi-wheel-summary]:pt-2 [&_.papi-wheel-summary]:text-xs [&_.papi-wheel-summary]:text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderPapiWheelSvg(rows) }}/>);
        }
        if (isMsdtResult(r)) {
            var rows = (0, msdtScoring_1.getMsdtRows)(cats);
            return (<div className="space-y-4">
          <recharts_1.ResponsiveContainer width="100%" height={320}>
            <recharts_1.BarChart data={rows} margin={{ left: 10, right: 20, top: 10, bottom: 40 }}>
              <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)"/>
              <recharts_1.XAxis dataKey="label" interval={0} angle={-25} textAnchor="end" height={80} tick={{ fill: "hsl(210,20%,75%)", fontSize: 10 }}/>
              <recharts_1.YAxis domain={[0, 100]} allowDecimals={false} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }}/>
              <recharts_1.Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} formatter={function (v, _name, props) { return ["".concat(v, "% (").concat(props.payload.value, ")"), "Skor"]; }}/>
              <recharts_1.Bar dataKey="pct" fill="#2dd4bf" radius={[4, 4, 0, 0]}/>
            </recharts_1.BarChart>
          </recharts_1.ResponsiveContainer>
        </div>);
        }
        if (isAptitudeResult(r)) {
            var effectiveCats = getEffectiveAptitudeCategories(r, answers);
            var aptitudeRowsData = getAptitudeRows(effectiveCats).map(function (row) { return ({
                name: row.label,
                value: row.pct,
                raw: row.raw,
                max: row.max,
                level: row.level,
            }); });
            return (<recharts_1.ResponsiveContainer width="100%" height={320}>
          <recharts_1.BarChart data={aptitudeRowsData} margin={{ left: 20, right: 30, top: 20, bottom: 50 }}>
            <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)"/>
            <recharts_1.XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 11, fontWeight: 600 }} angle={-18} textAnchor="end" height={62}/>
            <recharts_1.YAxis domain={[0, 100]} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }}/>
            <recharts_1.Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} formatter={function (v, _name, item) { return ["".concat(v, "% (").concat(item.payload.raw, "/").concat(item.payload.max, ")"), item.payload.level]; }}/>
            <recharts_1.Bar dataKey="value" fill="#2dd4bf" radius={[4, 4, 0, 0]}/>
          </recharts_1.BarChart>
        </recharts_1.ResponsiveContainer>);
        }
        // CFIT 3A - Culture Fair Intelligence Test
        if ((0, cfitScoring_1.isCfitName)(r.test_name)) {
            var iqInfo = (0, cfitScoring_1.getCfitIqInfoFromResult)(r);
            var rawScore = iqInfo.raw;
            var segmentMax_1 = { Series: 13, Classifications: 14, Matrices: 13, Conditions: 10 };
            var normalizeSegment_1 = function (category) {
                var text = String(category || "").toUpperCase();
                if (text.includes("SERIES") || text === "S1")
                    return "Series";
                if (text.includes("CLASSIFICATION") || text === "S2")
                    return "Classifications";
                if (text.includes("MATRICES") || text === "S3")
                    return "Matrices";
                if (text.includes("CONDITION") || text === "S4")
                    return "Conditions";
                return "";
            };
            var segmentCounts_1 = answers.reduce(function (acc, answer) {
                if (answer.is_correct !== true)
                    return acc;
                var segment = normalizeSegment_1(answer.category);
                if (!segment)
                    return acc;
                acc[segment] = (acc[segment] || 0) + 1;
                return acc;
            }, {});
            var segmentData_1 = Object.keys(segmentMax_1).map(function (name) { return ({
                name: name,
                value: segmentCounts_1[name] || 0,
                max: segmentMax_1[name],
            }); });
            var hasSegmentAnswers = answers.some(function (answer) { return answer.is_correct !== null && normalizeSegment_1(answer.category); });
            return (<div className="space-y-4">
          {/* IQ Score Display */}
          <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 to-primary/5 p-6 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-2">Hasil IQ dan Klasifikasi</p>
            <div className="flex items-center justify-center gap-6">
              <div>
                <p className="text-5xl font-bold text-primary">{iqInfo.iq}</p>
                <p className="text-xs text-muted-foreground mt-1">IQ Score</p>
              </div>
              <div className="w-px h-16 bg-border"></div>
              <div>
                <p className="text-2xl font-bold text-primary">{iqInfo.classification}</p>
                <p className="text-xs text-muted-foreground mt-1">Klasifikasi</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Raw Score: {rawScore} / {iqInfo.max}</p>
          </div>

          {hasSegmentAnswers && (<div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-foreground mb-3">Benar per Segmen CFIT</p>
              <recharts_1.ResponsiveContainer width="100%" height={260}>
                <recharts_1.BarChart data={segmentData_1} margin={{ left: 20, right: 30, top: 20, bottom: 30 }}>
                  <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)"/>
                  <recharts_1.XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 10 }}/>
                  <recharts_1.YAxis domain={[0, 14]} allowDecimals={false} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }}/>
                  <recharts_1.Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }} formatter={function (v, _name, item) { return ["".concat(v, "/").concat(item.payload.max), "Benar"]; }}/>
                  <recharts_1.Bar dataKey="value" fill="#2dd4bf" radius={[4, 4, 0, 0]} label={function (_a) {
                        var _b;
                        var x = _a.x, y = _a.y, width = _a.width, value = _a.value, index = _a.index;
                        var max = ((_b = segmentData_1[index]) === null || _b === void 0 ? void 0 : _b.max) || 0;
                        return <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#2dd4bf" fontSize={11} fontWeight={700}>{value}/{max}</text>;
                    }}/>
                </recharts_1.BarChart>
              </recharts_1.ResponsiveContainer>
            </div>)}
        </div>);
        }
        return (<recharts_1.ResponsiveContainer width="100%" height={280}>
        <recharts_1.BarChart data={data}>
          <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)"/>
          <recharts_1.XAxis dataKey="name" tick={{ fill: "hsl(210,20%,75%)", fontSize: 10 }} angle={-30} textAnchor="end" height={60}/>
          <recharts_1.YAxis domain={[0, 100]} tick={{ fill: "hsl(210,20%,70%)", fontSize: 11 }}/>
          <recharts_1.Tooltip contentStyle={{ background: "hsl(220,18%,12%)", border: "1px solid hsl(220,14%,20%)", borderRadius: 8, color: "#fff" }}/>
          <recharts_1.Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]}/>
        </recharts_1.BarChart>
      </recharts_1.ResponsiveContainer>);
    };
    // === Interpretasi otomatis Personality Plus (4 Temperamen) ===
    var buildPersonalityPlusInterpretation = function (cats, total) {
        return (0, personalityPlusScoring_1.buildPersonalityPlusInterpretation)(cats, total);
    };
    if (selectedResult) {
        var r_1 = selectedResult;
        var cats_1 = isPapiResult(r_1)
            ? getEffectivePapiCategories(r_1, answers)
            : isAptitudeResult(r_1)
                ? getEffectiveAptitudeCategories(r_1, answers)
                : r_1.categories;
        var scoreResult_1 = isAptitudeResult(r_1) ? __assign(__assign({}, r_1), { categories: cats_1 }) : r_1;
        var catEntries = Object.entries(cats_1);
        var cfitProfileRows = (0, cfitScoring_1.isCfitName)(r_1.test_name) ? (0, cfitScoring_1.getCfitProfileRows)(r_1) : [];
        var profile = r_1.candidate_profile;
        return (<AdminLayout_1.default>
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={function () { setSelectedResult(null); setAnswers([]); }} className="text-sm text-primary hover:underline">← Kembali ke Daftar Hasil</button>
            <div className="flex flex-wrap gap-2">
              <button onClick={handlePrint} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
                <lucide_react_1.Printer className="h-4 w-4"/> Cetak Laporan Lengkap
              </button>
            </div>
          </div>

          <div ref={printRef} className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
            {/* Profile card */}
            <div className="glass rounded-xl p-6 glow-border space-y-4">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {(profile === null || profile === void 0 ? void 0 : profile.photo_url) ? (<img src={profile.photo_url} alt={r_1.candidate_name} className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg object-cover border-2 border-primary/40"/>) : (<div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-lg bg-primary/20 text-primary text-3xl font-bold border-2 border-primary/40">{r_1.candidate_name.charAt(0)}</div>)}
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground">{r_1.candidate_name}</h2>
                  <p className="text-sm text-muted-foreground">{r_1.position}</p>
                  <span className={"mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ".concat(getResultStatusBadge(r_1).className)}>
                    {getResultStatusBadge(r_1).label}
                  </span>
                </div>
                <div className="ml-auto text-center">
                  {r_1.webcam_photo_url ? (<img src={r_1.webcam_photo_url} alt="Screenshot saat tes" className="h-24 w-32 rounded-lg border border-border object-cover"/>) : (<div className="h-24 w-32 rounded-lg border border-dashed border-border bg-muted/30" aria-label="Screenshot saat tes kosong"/>)}
                  <p className="text-[10px] text-muted-foreground mt-1">Screenshot saat tes</p>
                </div>
              </div>
              {profile && (<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-t border-border pt-4">
                  <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{profile.email}</span></div>
                  <div><span className="text-muted-foreground">Telepon:</span> <span className="text-foreground">{profile.phone}</span></div>
                  <div><span className="text-muted-foreground">Tgl Lahir:</span> <span className="text-foreground">{profile.birthDate}</span></div>
                  <div><span className="text-muted-foreground">Pendidikan:</span> <span className="text-foreground">{profile.education}</span></div>
                  <div><span className="text-muted-foreground">Gender:</span> <span className="text-foreground">{profile.gender}</span></div>
                  <div><span className="text-muted-foreground">Tes Selesai:</span> <span className="text-foreground">{(_b = r_1.completed_at) === null || _b === void 0 ? void 0 : _b.split("T")[0]}</span></div>
                </div>)}
            </div>

            {/* Score cards */}
            <div className="grid gap-4 sm:grid-cols-3 mt-4">
              <div className="glass rounded-xl p-5 glow-border text-center">
                <p className="text-xs text-muted-foreground">Alat Tes</p>
                <p className="text-lg font-bold text-primary mt-1">{r_1.test_name}</p>
              </div>
              <div className="glass rounded-xl p-5 glow-border text-center">
                <p className="text-xs text-muted-foreground">{(0, cfitScoring_1.isCfitName)(r_1.test_name) ? "IQ Score" : isIstResult(r_1) ? "Skor IST" : isMbtiResult(r_1) ? "Tipe MBTI" : isAptitudeResult(r_1) ? "IQ Aptitude" : "Skor"}</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {(0, cfitScoring_1.isCfitName)(r_1.test_name)
                ? (function () {
                    var iqClassification = {
                        49: { iq: 183, classification: "GENIUS" },
                        48: { iq: 179, classification: "GENIUS" },
                        47: { iq: 176, classification: "GENIUS" },
                        46: { iq: 173, classification: "GENIUS" },
                        45: { iq: 169, classification: "VERY SUPERIOR" },
                        44: { iq: 167, classification: "VERY SUPERIOR" },
                        43: { iq: 165, classification: "VERY SUPERIOR" },
                        42: { iq: 161, classification: "VERY SUPERIOR" },
                        41: { iq: 157, classification: "VERY SUPERIOR" },
                        40: { iq: 155, classification: "VERY SUPERIOR" },
                        39: { iq: 152, classification: "VERY SUPERIOR" },
                        38: { iq: 149, classification: "VERY SUPERIOR" },
                        37: { iq: 145, classification: "VERY SUPERIOR" },
                        36: { iq: 142, classification: "VERY SUPERIOR" },
                        35: { iq: 140, classification: "VERY SUPERIOR" },
                        34: { iq: 137, classification: "SUPERIOR" },
                        33: { iq: 133, classification: "SUPERIOR" },
                        32: { iq: 131, classification: "SUPERIOR" },
                        31: { iq: 128, classification: "SUPERIOR" },
                        30: { iq: 124, classification: "SUPERIOR" },
                        29: { iq: 121, classification: "SUPERIOR" },
                        28: { iq: 119, classification: "HIGH AVERAGE" },
                        27: { iq: 116, classification: "HIGH AVERAGE" },
                        26: { iq: 113, classification: "HIGH AVERAGE" },
                        25: { iq: 109, classification: "AVERAGE" },
                        24: { iq: 106, classification: "AVERAGE" },
                        23: { iq: 103, classification: "AVERAGE" },
                        22: { iq: 100, classification: "AVERAGE" },
                        21: { iq: 96, classification: "AVERAGE" },
                        20: { iq: 94, classification: "AVERAGE" },
                        19: { iq: 91, classification: "AVERAGE" },
                        18: { iq: 88, classification: "LOW AVERAGE" },
                        17: { iq: 85, classification: "LOW AVERAGE" },
                        16: { iq: 81, classification: "LOW AVERAGE" },
                        15: { iq: 78, classification: "BOEDERLINE MENTAL RETARDATION" },
                        14: { iq: 75, classification: "BOEDERLINE MENTAL RETARDATION" },
                        13: { iq: 72, classification: "BOEDERLINE MENTAL RETARDATION" },
                        12: { iq: 70, classification: "BOEDERLINE MENTAL RETARDATION" },
                        11: { iq: 67, classification: "MILD MENTAL RETARDATION" },
                        10: { iq: 65, classification: "MILD MENTAL RETARDATION" },
                        9: { iq: 60, classification: "MILD MENTAL RETARDATION" },
                        8: { iq: 57, classification: "MILD MENTAL RETARDATION" },
                        7: { iq: 55, classification: "MILD MENTAL RETARDATION" },
                        6: { iq: 52, classification: "MILD MENTAL RETARDATION" },
                        5: { iq: 48, classification: "MODERATE MENTAL RETARDATION" },
                        4: { iq: 47, classification: "MODERATE MENTAL RETARDATION" },
                        3: { iq: 45, classification: "MODERATE MENTAL RETARDATION" },
                        2: { iq: 43, classification: "MODERATE MENTAL RETARDATION" },
                        1: { iq: 40, classification: "MODERATE MENTAL RETARDATION" },
                        0: { iq: 38, classification: "MODERATE MENTAL RETARDATION" }
                    };
                    return (0, cfitScoring_1.getCfitIqInfoFromResult)(r_1).iq;
                })()
                : (r_1.test_name === "Personality Plus" || r_1.test_name.includes("Personality Plus"))
                    ? (function () {
                        var ppMap = {
                            K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
                            S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
                            M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
                            P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
                        };
                        var norm = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
                        Object.entries(cats_1).forEach(function (_a) {
                            var k = _a[0], v = _a[1];
                            var n = ppMap[k] || k;
                            if (n in norm)
                                norm[n] += Number(v) || 0;
                        });
                        var sorted = Object.entries(norm).sort(function (a, b) { return b[1] - a[1]; });
                        var dominant = sorted[0];
                        var second = sorted[1];
                        var diff = dominant[1] - second[1];
                        if (diff >= 1 && diff <= 4) {
                            return <span className="text-4xl font-extrabold text-pink-400">{dominant[0]} ({dominant[1]}) / {second[0]} ({second[1]})</span>;
                        }
                        else {
                            return <span className="text-4xl font-extrabold text-pink-400">{dominant[0]} ({dominant[1]})</span>;
                        }
                    })()
                    : isIstResult(r_1)
                        ? "".concat(getIstSummary(cats_1, r_1.score).score, "%")
                        : isMbtiResult(r_1)
                            ? <span className="text-4xl font-extrabold tracking-widest text-primary">{getMbtiSummary(cats_1).type}</span>
                            : isAptitudeResult(r_1)
                                ? String(getAptitudeScoreInfo(scoreResult_1).iq)
                                : "".concat(r_1.score, "%")}
                </p>
                {isAptitudeResult(r_1) && (function () {
                var info = getAptitudeScoreInfo(scoreResult_1);
                return (<p className="mt-1 text-xs text-muted-foreground">
                      {info.classification} · {info.raw}/{info.total} benar · {info.percentage}%
                    </p>);
            })()}

                {isIstResult(r_1) && (<p className="mt-1 text-xs text-muted-foreground">
                    Raw {getIstSummary(cats_1, r_1.score).raw}/{getIstSummary(cats_1, r_1.score).max}
                  </p>)}
              </div>
              <div className="glass rounded-xl p-5 glow-border text-center">
                <p className="text-xs text-muted-foreground">Soal Dijawab</p>
                <p className="text-lg font-bold text-foreground mt-1">{r_1.answered_questions} / {r_1.total_questions}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="glass rounded-xl p-5 glow-border mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Grafik Hasil — {r_1.test_name}</h3>
              {renderChart(r_1)}
            </div>

            {/* Score table */}
            <div className="glass rounded-xl p-5 glow-border mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Detail Skor per Dimensi</h3>
              <div className="overflow-x-auto">
                {r_1.test_name.toUpperCase().includes("DISC") ? (function () {
                var dims = ["D", "I", "S", "C"];
                var dimMap = { D: "Dominance", I: "Influence", S: "Steadiness", C: "Compliance" };
                var dimLabels = {
                    D: "Dominance — Pengarah, tegas, berorientasi hasil",
                    I: "Influence — Persuasif, ekspresif, sosial",
                    S: "Steadiness — Stabil, sabar, kooperatif",
                    C: "Conscientiousness — Teliti, analitis, sistematis",
                };
                // Check if using old format (D, I, S, C) or new format (full names)
                var useOldFormat = cats_1["D"] !== undefined || cats_1["I"] !== undefined || cats_1["S"] !== undefined || cats_1["C"] !== undefined;
                var M = function (d) {
                    if (useOldFormat) {
                        return cats_1["".concat(d, "_M")] !== undefined ? Number(cats_1["".concat(d, "_M")]) : null;
                    }
                    else {
                        var fullName = dimMap[d];
                        return cats_1["".concat(fullName, "_M")] !== undefined ? Number(cats_1["".concat(fullName, "_M")]) : null;
                    }
                };
                var L = function (d) {
                    if (useOldFormat) {
                        return cats_1["".concat(d, "_L")] !== undefined ? Number(cats_1["".concat(d, "_L")]) : null;
                    }
                    else {
                        var fullName = dimMap[d];
                        return cats_1["".concat(fullName, "_L")] !== undefined ? Number(cats_1["".concat(fullName, "_L")]) : null;
                    }
                };
                var N = function (d) {
                    if (useOldFormat) {
                        return Number(cats_1[d] || 0);
                    }
                    else {
                        var fullName = dimMap[d];
                        return Number(cats_1[fullName] || 0);
                    }
                };
                var totalQ = r_1.total_questions || 24;
                var sorted = __spreadArray([], dims, true).sort(function (a, b) { return N(b) - N(a); });
                var rank = {};
                sorted.forEach(function (d, i) { rank[d] = i + 1; });
                var level = function (n) { return n >= Math.ceil(totalQ * 0.25) ? "Tinggi" : n >= 1 ? "Sedang" : n <= -Math.ceil(totalQ * 0.25) ? "Rendah" : "Netral"; };
                var levelColor = function (lv) { return lv === "Tinggi" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : lv === "Rendah" ? "bg-red-500/20 text-red-400 border-red-500/40"
                        : lv === "Sedang" ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            : "bg-muted text-muted-foreground border-border"; };
                return (<div className="space-y-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Dimensi</th>
                            <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground" title="Most-like (Mask)">M</th>
                            <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground" title="Least-like (Core)">L</th>
                            <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground" title="Net = M − L (Mirror)">Net</th>
                            <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground">Level</th>
                            <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground">Rank</th>
                            <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground w-[35%]">Visual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dims.map(function (d) {
                        var m = M(d);
                        var l = L(d);
                        var n = N(d);
                        var lv = level(n);
                        var w = Math.min(50, Math.abs(n) / Math.max(totalQ, 1) * 50);
                        return (<tr key={d} className="border-b border-border/50">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-foreground">{d}</div>
                                  <div className="text-[11px] text-muted-foreground">{dimLabels[d]}</div>
                                </td>
                                <td className="py-2.5 px-3 text-center text-emerald-400 font-semibold">{m === null ? "-" : m}</td>
                                <td className="py-2.5 px-3 text-center text-amber-400 font-semibold">{l === null ? "-" : l}</td>
                                <td className={"py-2.5 px-3 text-center font-bold ".concat(n > 0 ? 'text-emerald-400' : n < 0 ? 'text-red-400' : 'text-muted-foreground')}>{n > 0 ? "+".concat(n) : n}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={"inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ".concat(levelColor(lv))}>{lv}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center text-foreground font-semibold">#{rank[d]}</td>
                                <td className="py-2.5 px-3">
                                  <div className="relative h-5 bg-muted/40 rounded">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border"/>
                                    {n >= 0 ? (<div className="absolute left-1/2 top-0 bottom-0 bg-emerald-500/70 rounded-r" style={{ width: "".concat(w, "%") }}/>) : (<div className="absolute right-1/2 top-0 bottom-0 bg-red-500/70 rounded-l" style={{ width: "".concat(w, "%") }}/>)}
                                  </div>
                                </td>
                              </tr>);
                    })}
                        </tbody>
                      </table>
                      <div className="grid gap-2 sm:grid-cols-2 text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                        <p><span className="font-semibold text-foreground">M (Most):</span> jumlah dipilih sebagai "Paling Sesuai" (Mask).</p>
                        <p><span className="font-semibold text-foreground">L (Least):</span> jumlah dipilih sebagai "Paling Tidak Sesuai" (Core).</p>
                        <p><span className="font-semibold text-foreground">Net:</span> M − L → kekuatan natural (Mirror).</p>
                        <p><span className="font-semibold text-foreground">Rank:</span> urutan kekuatan dimensi (1 = paling dominan).</p>
                      </div>
                    </div>);
            })()
                : isIstResult(r_1) ? (function () {
                    var summary = getIstSummary(cats_1, r_1.score);
                    return (<table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Subtes</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Aspek</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skor</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Level</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
                      </tr></thead>
                      <tbody>
                        {summary.rows.map(function (row) { return (<tr key={row.code} className="border-b border-border/50">
                            <td className="py-2 px-3 text-foreground font-semibold">{row.code} - {row.name}</td>
                            <td className="py-2 px-3 text-muted-foreground">{row.area}</td>
                            <td className="py-2 px-3 text-foreground">{row.raw}/{row.max} <span className="text-muted-foreground">({row.pct}%)</span></td>
                            <td className="py-2 px-3 text-foreground">{row.level}</td>
                            <td className="py-2 px-3 w-40">
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className={"h-full rounded-full ".concat(row.pct >= 65 ? "bg-emerald-400" : row.pct >= 45 ? "bg-amber-400" : "bg-destructive")} style={{ width: "".concat(Math.min(row.pct, 100), "%") }}/>
                              </div>
                            </td>
                          </tr>); })}
                      </tbody>
                    </table>);
                })()
                    : isMbtiResult(r_1) ? (function () {
                        var summary = getMbtiSummary(cats_1);
                        return (<table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Pasangan</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skor</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Dominan</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Kekuatan</th>
                      </tr></thead>
                      <tbody>
                        {summary.rows.map(function (row) { return (<tr key={row.pair} className="border-b border-border/50">
                            <td className="py-2 px-3 text-foreground font-semibold">{row.pair}</td>
                            <td className="py-2 px-3 text-muted-foreground">{row.a}={row.av} / {row.b}={row.bv}</td>
                            <td className="py-2 px-3 text-primary font-bold">{row.dominant}</td>
                            <td className="py-2 px-3 text-foreground">{row.pct}%</td>
                          </tr>); })}
                      </tbody>
                    </table>);
                    })()
                        : isKraepelinResult(r_1) ? (<table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Aspek</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skor</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
                    </tr></thead>
                    <tbody>
                      {getKraepelinRows(cats_1).map(function (row) { return (<tr key={row.key} className="border-b border-border/50">
                          <td className="py-2 px-3 text-foreground font-medium">{row.label}</td>
                          <td className="py-2 px-3 text-foreground">{row.value}%</td>
                          <td className="py-2 px-3 w-40">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className={"h-full rounded-full ".concat(row.value >= 70 ? "bg-emerald-400" : row.value >= 40 ? "bg-amber-400" : "bg-destructive")} style={{ width: "".concat(Math.min(row.value, 100), "%") }}/>
                            </div>
                          </td>
                        </tr>); })}
                      <tr className="border-b border-border/50">
                        <td className="py-2 px-3 text-muted-foreground">Benar / Salah</td>
                        <td className="py-2 px-3 text-foreground" colSpan={2}>{Number(cats_1.correct_answers || 0)} / {Number(cats_1.wrong_answers || 0)}</td>
                      </tr>
                    </tbody>
                  </table>)
                            : isPapiResult(r_1) ? (<table className="w-full text-xs">
                    <thead><tr className="border-b border-border">
                      <th className="py-1.5 px-2 text-left text-[11px] font-semibold text-muted-foreground">Skala</th>
                      <th className="py-1.5 px-2 text-left text-[11px] font-semibold text-muted-foreground">Skor</th>
                      <th className="py-1.5 px-2 text-left text-[11px] font-semibold text-muted-foreground">Level</th>
                      <th className="py-1.5 px-2 text-left text-[11px] font-semibold text-muted-foreground">Indikator</th>
                    </tr></thead>
                    <tbody>
                      {(0, papiScoring_1.getPapiRows)(cats_1).map(function (row) {
                                    var pct = (row.value / row.max) * 100;
                                    return (<tr key={row.code} className="border-b border-border/50">
                            <td className="py-1.5 px-2 text-foreground"><span className="font-bold">{row.code}</span><span className="text-muted-foreground"> - {row.label}</span></td>
                            <td className="py-1.5 px-2 text-foreground whitespace-nowrap">{row.value}/{row.max}</td>
                            <td className="py-1.5 px-2 text-muted-foreground whitespace-nowrap">{row.level}</td>
                            <td className="py-1.5 px-2 w-32">
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className={"h-full rounded-full ".concat(pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-destructive")} style={{ width: "".concat(Math.min(pct, 100), "%") }}/>
                              </div>
                            </td>
                          </tr>);
                                })}
                    </tbody>
                  </table>)
                                : isAptitudeResult(r_1) ? (<table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Aspek</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skor</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Level</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Keterangan</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
                    </tr></thead>
                    <tbody>
                      {getAptitudeRows(cats_1).map(function (row) { return (<tr key={row.key} className="border-b border-border/50">
                          <td className="py-2 px-3 text-foreground font-medium">{row.label}</td>
                          <td className="py-2 px-3 text-foreground">{row.raw}/{row.max} <span className="text-muted-foreground">({row.pct}%)</span></td>
                          <td className="py-2 px-3 text-foreground">{row.level}</td>
                          <td className="py-2 px-3 text-muted-foreground">{row.note}</td>
                          <td className="py-2 px-3 w-40">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className={"h-full rounded-full ".concat(row.pct >= 65 ? "bg-emerald-400" : row.pct >= 50 ? "bg-amber-400" : "bg-destructive")} style={{ width: "".concat(Math.min(row.pct, 100), "%") }}/>
                            </div>
                          </td>
                        </tr>); })}
                    </tbody>
                  </table>)
                                    : (r_1.test_name === "Personality Plus" || r_1.test_name.includes("Personality Plus")) ? (function () {
                                        var ppMap = {
                                            K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
                                            S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
                                            M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
                                            P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
                                        };
                                        var norm = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
                                        Object.entries(cats_1).forEach(function (_a) {
                                            var k = _a[0], v = _a[1];
                                            var n = ppMap[k] || k;
                                            if (n in norm)
                                                norm[n] += Number(v) || 0;
                                        });
                                        var totalAns = Object.values(norm).reduce(function (a, b) { return a + b; }, 0) || 1;
                                        var maxVal = Math.max.apply(Math, __spreadArray(__spreadArray([], Object.values(norm), false), [1], false));
                                        return (<table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Temperamen</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Jumlah Jawaban</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Proporsi</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
                      </tr></thead>
                      <tbody>
                        {['Sanguinis', 'Koleris', 'Melankolis', 'Plegmatis'].map(function (t) {
                                                var v = norm[t];
                                                var pctRel = (v / maxVal) * 100;
                                                var pctTotal = Math.round((v / totalAns) * 100);
                                                return (<tr key={t} className="border-b border-border/50">
                              <td className="py-2 px-3 text-foreground font-medium">{t}</td>
                              <td className="py-2 px-3 text-foreground">{v} jawaban</td>
                              <td className="py-2 px-3 text-muted-foreground">{pctTotal}%</td>
                              <td className="py-2 px-3 w-40">
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-primary" style={{ width: "".concat(pctRel, "%") }}/>
                                </div>
                              </td>
                            </tr>);
                                            })}
                      </tbody>
                    </table>);
                                    })() : (
                                    // Other tests: Vertical bar chart
                                    <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Dimensi</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Skor</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Indikator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(0, cfitScoring_1.isCfitName)(r_1.test_name) ? cfitProfileRows.map(function (row) { return (<tr key={row.label} className="border-b border-border/50">
                          <td className="py-2 px-3 text-foreground font-medium">{row.label}</td>
                          <td className="py-2 px-3 text-foreground">{row.value}</td>
                          <td className="py-2 px-3 text-muted-foreground">{row.note}</td>
                        </tr>); }) : catEntries.map(function (_a) {
                                            var dim = _a[0], val = _a[1];
                                            var maxVal = isPapiResult(r_1) ? 9 : isMsdtResult(r_1) ? 64 : 100;
                                            var pct = (val / maxVal) * 100;
                                            var suffix = isPapiResult(r_1) ? "/9" : isMsdtResult(r_1) ? "/".concat(maxVal) : "%";
                                            return (<tr key={dim} className="border-b border-border/50">
                            <td className="py-2 px-3 text-foreground font-medium">{dim}</td>
                            <td className="py-2 px-3 text-foreground">{val}{suffix}</td>
                            <td className="py-2 px-3 w-40">
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className={"h-full rounded-full ".concat(pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-destructive")} style={{ width: "".concat(pct, "%") }}/>
                              </div>
                            </td>
                          </tr>);
                                        })}
                    </tbody>
                  </table>)}
              </div>
            </div>

            {/* Interpretation — pakai narasi otomatis untuk Personality Plus */}
            {(function () {
                var isPP = r_1.test_name === "Personality Plus" || r_1.test_name.includes("Personality Plus");
                var isIST = isIstResult(r_1);
                var isDISC = r_1.test_name.toUpperCase().includes("DISC");
                var interpText = isPP
                    ? buildPersonalityPlusInterpretation(cats_1, r_1.total_questions || 40)
                    : isIST
                        ? buildIstInterpretation(cats_1, r_1.score)
                        : (0, cfitScoring_1.isCfitName)(r_1.test_name)
                            ? (0, cfitScoring_1.buildCfitInterpretation)(r_1)
                            : isMbtiResult(r_1)
                                ? buildMbtiInterpretation(cats_1)
                                : isKraepelinResult(r_1)
                                    ? buildKraepelinInterpretation(cats_1)
                                    : isPapiResult(r_1)
                                        ? (0, papiScoring_1.buildPapiInterpretation)(cats_1)
                                        : isMsdtResult(r_1)
                                            ? (0, msdtScoring_1.buildMsdtInterpretation)(cats_1, r_1.answered_questions, r_1.total_questions)
                                            : isAptitudeResult(r_1)
                                                ? buildAptitudeInterpretation(cats_1, scoreResult_1.score, r_1.answered_questions, r_1.total_questions)
                                                : r_1.interpretation;
                if (!interpText)
                    return null;
                var useStructuredInterpretation = isPP || isDISC || isMbtiResult(r_1) || (0, cfitScoring_1.isCfitName)(r_1.test_name) || isPapiResult(r_1) || isMsdtResult(r_1) || isAptitudeResult(r_1);
                return (<div className="glass rounded-xl p-5 glow-border mt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Interpretasi Psikolog{isPP ? ' — Profil 4 Temperamen' : isIST ? ' — Profil IST' : (0, cfitScoring_1.isCfitName)(r_1.test_name) ? ' — Profil CFIT 3A' : isMbtiResult(r_1) ? ' — Profil MBTI' : isKraepelinResult(r_1) ? ' — Profil Kraepelin' : isPapiResult(r_1) ? ' — Profil PAPI' : isMsdtResult(r_1) ? ' — Profil MSDT' : isAptitudeResult(r_1) ? ' — Profil Aptitude' : ''}</h3>
                  {useStructuredInterpretation ? (<div className="space-y-2 text-sm leading-relaxed text-muted-foreground [&_.papi-interpretation-heading]:mt-4 [&_.papi-interpretation-heading:first-child]:mt-0 [&_.papi-interpretation-heading]:text-xs [&_.papi-interpretation-heading]:font-bold [&_.papi-interpretation-heading]:uppercase [&_.papi-interpretation-heading]:tracking-wide [&_.papi-interpretation-heading]:text-primary [&_.papi-interpretation-list]:ml-5 [&_.papi-interpretation-list]:list-disc [&_.papi-interpretation-list_li]:my-1 [&_.papi-interpretation-paragraph]:my-1" dangerouslySetInnerHTML={{ __html: formatPapiInterpretationHtml(interpText) }}/>) : (<p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{interpText}</p>)}
                </div>);
            })()}

            {/* Answers section */}
            <div className="glass rounded-xl p-5 glow-border mt-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <lucide_react_1.FileText className="h-4 w-4 text-primary"/>
                Lembar Jawaban ({answers.length} soal)
              </h3>
              {answers.length === 0 ? (<p className="text-sm text-muted-foreground py-4 text-center">Belum ada data jawaban tersimpan untuk tes ini.</p>) : (<div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground w-12">No</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Soal</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Jawaban</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Kategori</th>
                      </tr>
                    </thead>
                    <tbody>
                      {answers.map(function (a) {
                    var _a;
                    return (<tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 text-foreground font-medium">{a.question_number}</td>
                          <td className="py-2.5 px-3">
                            <p className="text-foreground text-xs leading-relaxed">{a.question_text}</p>
                            {a.question_text_en && <p className="text-muted-foreground text-xs italic mt-0.5">{a.question_text_en}</p>}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={"inline-block rounded-md bg-primary/10 text-primary px-2 text-xs font-medium ".concat(((_a = a.selected_answer) === null || _a === void 0 ? void 0 : _a.includes('PALING')) ? 'py-1 leading-relaxed whitespace-pre-wrap max-w-md' : 'py-0.5')}>
                              {getAnswerDisplayText(a, !r_1.test_name.toUpperCase().includes("DISC"))}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">
                            {(function () {
                            var _a;
                            var ppMap = {
                                K: 'Koleris', C: 'Koleris', Choleric: 'Koleris', Koleris: 'Koleris',
                                S: 'Sanguinis', Sanguine: 'Sanguinis', Sanguinis: 'Sanguinis',
                                M: 'Melankolis', Melancholy: 'Melankolis', Melancholic: 'Melankolis', Melankolis: 'Melankolis',
                                P: 'Plegmatis', Phlegmatic: 'Plegmatis', Plegmatis: 'Plegmatis', Plegmatic: 'Plegmatis',
                            };
                            if ((r_1.test_name === "Personality Plus" || r_1.test_name.includes("Personality Plus")) && a.category) {
                                return ppMap[a.category] || a.category;
                            }
                            if (r_1.test_name.toUpperCase().includes("DISC") && ((_a = a.selected_answer) === null || _a === void 0 ? void 0 : _a.includes("PALING")) && a.selected_answer_label) {
                                return a.selected_answer_label;
                            }
                            if (isPapiResult(r_1) && a.category) {
                                return PAPI_LABELS[a.category] ? "".concat(a.category, " - ").concat(PAPI_LABELS[a.category]) : a.category;
                            }
                            return a.category || "-";
                        })()}
                          </td>
                        </tr>);
                })}
                    </tbody>
                  </table>
                </div>)}
            </div>
          </div>
        </div>
      </AdminLayout_1.default>);
    }
    return (<AdminLayout_1.default>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Hasil Tes</h1>
            <p className="text-sm text-muted-foreground">Lihat dan kelola hasil tes kandidat</p>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            <lucide_react_1.Download className="h-4 w-4"/> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="relative max-w-sm flex-1">
            <lucide_react_1.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <input type="text" placeholder="Cari nama, posisi, atau tes..." value={search} onChange={function (e) { return setSearch(e.target.value); }} className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"/>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
            <select value={filterStatus} onChange={function (e) { return setFilterStatus(e.target.value); }} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="all">Semua Status</option>
              <option value="completed">Selesai</option>
              <option value="incomplete">Tidak Selesai</option>
              <option value="cheat">Cheat</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tes</label>
            <select value={filterTest} onChange={function (e) { return setFilterTest(e.target.value); }} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="all">Semua Tes</option>
              {uniqueTests.map(function (test) { return (<option key={test} value={test}>{test}</option>); })}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Dari Tanggal</label>
            <input type="date" value={filterDateFrom} onChange={function (e) { return setFilterDateFrom(e.target.value); }} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"/>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Sampai Tanggal</label>
            <input type="date" value={filterDateTo} onChange={function (e) { return setFilterDateTo(e.target.value); }} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"/>
          </div>

          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Per Halaman</label>
            <select value={itemsPerPage} onChange={function (e) { return setItemsPerPage(Number(e.target.value)); }} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          <button onClick={function () { return window.print(); }} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            <lucide_react_1.Printer className="h-4 w-4"/> Cetak Tabel
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nama Kandidat</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Posisi</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Tes</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kesimpulan</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Soal</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Tanggal</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (<tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">Memuat data...</td></tr>) : paginatedResults.map(function (r) {
            var _a;
            var conclusion = getResultConclusion(r, answersByResult[r.id] || []);
            var status = getResultStatusBadge(r);
            return (<tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{r.candidate_name}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.position}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    <span className="inline-block rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium">{r.test_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex max-w-[220px] rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                      {conclusion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {r.answered_questions}/{r.total_questions}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {(_a = r.completed_at) === null || _a === void 0 ? void 0 : _a.split("T")[0]}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={"inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ".concat(status.className)}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={function () { return handleSelectResult(r); }} className="rounded-lg border border-sky-400/40 bg-sky-500/15 p-2.5 text-sky-300 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-500 hover:text-white hover:shadow-sky-500/20" title="Lihat Detail">
                        <lucide_react_1.Eye className="h-5 w-5"/>
                      </button>
                      <button onClick={function () { setSelectedResult(r); handlePrint(); }} className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 p-2.5 text-emerald-300 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-white hover:shadow-emerald-500/20" title="Cetak Laporan">
                        <lucide_react_1.Printer className="h-5 w-5"/>
                      </button>
                      <button onClick={function () { return handleDeleteResult(r); }} className="rounded-lg border border-rose-400/40 bg-rose-500/15 p-2.5 text-rose-300 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-500 hover:text-white hover:shadow-rose-500/20" title="Hapus Hasil Tes">
                        <lucide_react_1.Trash2 className="h-5 w-5"/>
                      </button>
                    </div>
                  </td>
                </tr>);
        })}
              {!loading && paginatedResults.length === 0 && (<tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada data ditemukan</td></tr>)}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} hasil
            </div>
            <div className="flex items-center gap-2">
              <button onClick={function () { return setCurrentPage(function (p) { return Math.max(1, p - 1); }); }} disabled={currentPage === 1} className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
                ← Sebelumnya
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, function (_, i) {
                var pageNum;
                if (totalPages <= 5) {
                    pageNum = i + 1;
                }
                else if (currentPage <= 3) {
                    pageNum = i + 1;
                }
                else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                }
                else {
                    pageNum = currentPage - 2 + i;
                }
                return (<button key={pageNum} onClick={function () { return setCurrentPage(pageNum); }} className={"rounded-lg px-3 py-2 text-sm font-medium ".concat(currentPage === pageNum
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-foreground hover:bg-muted")}>
                      {pageNum}
                    </button>);
            })}
              </div>
              <button onClick={function () { return setCurrentPage(function (p) { return Math.min(totalPages, p + 1); }); }} disabled={currentPage === totalPages} className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
                Selanjutnya →
              </button>
            </div>
          </div>)}
      </div>
    </AdminLayout_1.default>);
};
exports.default = Results;
