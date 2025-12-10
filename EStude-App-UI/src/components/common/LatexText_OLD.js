import React, { useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { WebView } from "react-native-webview";

/**
 * Component hiển thị text có chứa LaTeX
 * Hỗ trợ inline math: $...$ hoặc \(...\)
 * Hỗ trợ display math: $$...$$ hoặc \[...\]
 */
const LatexText = ({ children, style, textStyle }) => {
  const { width } = useWindowDimensions();

  // Kiểm tra xem content có chứa LaTeX không
  const hasLatex = (text) => {
    if (!text || typeof text !== "string") return false;
    return (
      text.includes("$") ||
      text.includes("\\(") ||
      text.includes("\\[") ||
      text.includes("\\begin") ||
      text.includes("\\frac") ||
      text.includes("\\sqrt") ||
      text.includes("^") ||
      text.includes("_")
    );
  };

  // Convert LaTeX syntax sang HTML hiển thị được
  const convertLatexToHtml = (text) => {
    if (!text) return "";

    try {
      let html = text;

      // Xử lý display math với $$ trước (phải xử lý trước inline math)
      html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, latex) => {
        return `<div class="math-display">${convertLatexContent(latex)}</div>`;
      });

      // Xử lý inline math với $
      html = html.replace(/\$([^$]+?)\$/g, (match, latex) => {
        return `<span class="math-inline">${convertLatexContent(latex)}</span>`;
      });

      // Xử lý \(...\) inline math
      html = html.replace(/\\\(([^)]+?)\\\)/g, (match, latex) => {
        return `<span class="math-inline">${convertLatexContent(latex)}</span>`;
      });

      // Xử lý \[...\] display math
      html = html.replace(/\\\[([\s\S]+?)\\\]/g, (match, latex) => {
        return `<div class="math-display">${convertLatexContent(latex)}</div>`;
      });

      // Escape các ký tự HTML còn lại
      html = html
        .replace(/&(?!amp;|lt;|gt;|quot;|#)/g, "&amp;")
        .replace(/<(?!\/?(div|span|sup|sub|br)[>\s])/g, "&lt;");

      // Wrap trong paragraph nếu cần
      if (
        !html.startsWith("<div") &&
        !html.startsWith("<span") &&
        !html.startsWith("<p")
      ) {
        html = `<p>${html}</p>`;
      }

      return html;
    } catch (error) {
      console.error("❌ Error converting LaTeX:", error);
      return `<p>${text}</p>`;
    }
  };

  // Convert nội dung LaTeX sang HTML
  const convertLatexContent = (latex) => {
    let content = latex;

    // Xử lý \begin{cases}...\end{cases} - hệ phương trình
    content = content.replace(
      /\\begin\{cases\}([\s\S]+?)\\end\{cases\}/g,
      (match, inner) => {
        const lines = inner
          .split("\\\\")
          .map((line) => line.trim())
          .filter((line) => line);
        const htmlLines = lines
          .map((line) => {
            // Xử lý các ký hiệu trong mỗi dòng
            let processedLine = processLatexSymbols(line);
            return `<div style="text-align: left; padding: 2px 0;">${processedLine}</div>`;
          })
          .join("");
        return `<div style="border-left: 2px solid #333; padding-left: 10px; margin: 4px 0;">{<br/>${htmlLines}}</div>`;
      }
    );

    // Xử lý nếu không phải cases
    if (!content.includes("<div")) {
      content = processLatexSymbols(content);
    }

    return content;
  };

  // Xử lý các ký hiệu LaTeX cơ bản
  const processLatexSymbols = (text) => {
    let result = text;

    // Xử lý phân số \frac{a}{b}
    result = result.replace(
      /\\frac\{([^}]+)\}\{([^}]+)\}/g,
      (match, num, den) => {
        return `<span style="display: inline-block; vertical-align: middle;"><sup>${processLatexSymbols(
          num
        )}</sup>/<sub>${processLatexSymbols(den)}</sub></span>`;
      }
    );

    // Xử lý căn bậc hai \sqrt{x}
    result = result.replace(/\\sqrt\{([^}]+)\}/g, (match, inner) => {
      return `√(${processLatexSymbols(inner)})`;
    });

    // Xử lý mũ ^
    result = result.replace(/\^(\{[^}]+\}|[0-9a-zA-Z])/g, (match, exp) => {
      const exponent = exp.startsWith("{") ? exp.slice(1, -1) : exp;
      return `<sup>${exponent}</sup>`;
    });

    // Xử lý chỉ số dưới _
    result = result.replace(/_(\{[^}]+\}|[0-9a-zA-Z])/g, (match, sub) => {
      const subscript = sub.startsWith("{") ? sub.slice(1, -1) : sub;
      return `<sub>${subscript}</sub>`;
    });

    // Xử lý các ký hiệu toán học (phải xử lý \\le và \\ge trước \\leq và \\geq)
    result = result
      .replace(/\\le\b/g, "≤")
      .replace(/\\ge\b/g, "≥")
      .replace(/\\leq/g, "≤")
      .replace(/\\geq/g, "≥")
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\pm/g, "±")
      .replace(/\\mp/g, "∓")
      .replace(/\\neq/g, "≠")
      .replace(/\\approx/g, "≈")
      .replace(/\\equiv/g, "≡")
      .replace(/\\infty/g, "∞")
      .replace(/\\in/g, "∈")
      .replace(/\\notin/g, "∉")
      .replace(/\\subset/g, "⊂")
      .replace(/\\supset/g, "⊃")
      .replace(/\\cup/g, "∪")
      .replace(/\\cap/g, "∩")
      .replace(/\\emptyset/g, "∅")
      .replace(/\\forall/g, "∀")
      .replace(/\\exists/g, "∃")
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\gamma/g, "γ")
      .replace(/\\delta/g, "δ")
      .replace(/\\epsilon/g, "ε")
      .replace(/\\pi/g, "π")
      .replace(/\\theta/g, "θ")
      .replace(/\\lambda/g, "λ")
      .replace(/\\mu/g, "μ")
      .replace(/\\sigma/g, "σ")
      .replace(/\\omega/g, "ω")
      .replace(/\\Delta/g, "Δ")
      .replace(/\\Sigma/g, "Σ")
      .replace(/\\sum/g, "∑")
      .replace(/\\prod/g, "∏")
      .replace(/\\int/g, "∫")
      .replace(/\\rightarrow/g, "→")
      .replace(/\\leftarrow/g, "←")
      .replace(/\\Rightarrow/g, "⇒")
      .replace(/\\Leftarrow/g, "⇐")
      .replace(/\\Leftrightarrow/g, "⇔");

    return result;
  };

  const content =
    typeof children === "string" ? children : String(children || "");

  // Nếu không có LaTeX, render như Text bình thường
  if (!hasLatex(content)) {
    return (
      <View style={style}>
        <Text style={[styles.defaultText, textStyle]}>{content}</Text>
      </View>
    );
  }

  // Có LaTeX thì render bằng RenderHtml
  const htmlContent = convertLatexToHtml(content);

  // Normalize textStyle - chỉ lấy các thuộc tính hợp lệ
  const normalizeStyle = (styleInput) => {
    if (!styleInput) return {};

    // Nếu là array, flatten nó
    const flatStyle = Array.isArray(styleInput)
      ? Object.assign({}, ...styleInput.filter(Boolean))
      : styleInput;

    // Chỉ giữ các thuộc tính style hợp lệ
    const validKeys = [
      "fontSize",
      "fontWeight",
      "fontStyle",
      "color",
      "lineHeight",
      "textAlign",
      "marginVertical",
      "marginHorizontal",
      "margin",
      "padding",
      "paddingVertical",
      "paddingHorizontal",
    ];

    const normalized = {};
    Object.keys(flatStyle).forEach((key) => {
      if (validKeys.includes(key)) {
        normalized[key] = flatStyle[key];
      }
    });

    return normalized;
  };

  const normalizedTextStyle = normalizeStyle(textStyle);

  const tagsStyles = {
    p: {
      margin: 0,
      padding: 0,
      ...normalizedTextStyle,
    },
    span: {
      ...normalizedTextStyle,
    },
    div: {
      marginVertical: 8,
      ...normalizedTextStyle,
    },
    sup: {
      fontSize: (normalizedTextStyle.fontSize || 15) * 0.7,
      lineHeight: 0,
    },
    sub: {
      fontSize: (normalizedTextStyle.fontSize || 15) * 0.7,
      lineHeight: 0,
    },
  };

  const classesStyles = {
    "math-inline": {
      fontStyle: "italic",
      color: normalizedTextStyle.color || "#1a1a1a",
    },
    "math-display": {
      textAlign: "center",
      marginVertical: 8,
      fontStyle: "italic",
      fontSize: (normalizedTextStyle.fontSize || 15) * 1.1,
    },
  };

  return (
    <View style={style}>
      <RenderHtml
        contentWidth={width - 64}
        source={{ html: htmlContent }}
        tagsStyles={tagsStyles}
        classesStyles={classesStyles}
        enableExperimentalMarginCollapsing={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  defaultText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
});

export default LatexText;
