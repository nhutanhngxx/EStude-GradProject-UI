import React, { useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { WebView } from "react-native-webview";

/**
 * Component hiển thị text có chứa LaTeX sử dụng KaTeX
 * Hỗ trợ inline math: $...$ hoặc \(...\)
 * Hỗ trợ display math: $$...$$ hoặc \[...\] hoặc \begin{...}...\end{...}
 */
const LatexText = ({ children, style, textStyle }) => {
  const [webViewHeight, setWebViewHeight] = useState(50);

  // Kiểm tra xem content có chứa LaTeX không
  const hasLatex = (text) => {
    if (!text || typeof text !== "string") return false;
    return (
      text.includes("$") ||
      text.includes("\\(") ||
      text.includes("\\[") ||
      text.includes("\\begin") ||
      text.includes("\\frac") ||
      text.includes("\\sqrt")
    );
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

  // Normalize textStyle
  const normalizeStyle = (styleInput) => {
    if (!styleInput) return {};
    const flatStyle = Array.isArray(styleInput)
      ? Object.assign({}, ...styleInput.filter(Boolean))
      : styleInput;
    return flatStyle;
  };

  const normalizedStyle = normalizeStyle(textStyle);
  const fontSize = normalizedStyle.fontSize || 15;
  const color = normalizedStyle.color || "#333";
  const fontWeight = normalizedStyle.fontWeight || "400";

  // Escape nội dung để tránh lỗi JavaScript injection
  const escapedContent = content
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");

  // HTML template với KaTeX
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      font-size: ${fontSize}px;
      color: ${color};
      font-weight: ${fontWeight};
      line-height: 1.5;
      padding: 0;
      overflow-x: hidden;
      word-wrap: break-word;
      text-align: left;
    }
    #content {
      padding: 0;
      margin: 0;
      text-align: left;
      width: 100%;
    }
    .katex {
      font-size: 1em;
      margin: 0;
      padding: 0;
      text-align: left;
    }
    .katex-display {
      margin: 4px 0;
      padding: 0;
      overflow-x: auto;
      overflow-y: hidden;
      text-align: left !important;
    }
    .katex-display > .katex {
      text-align: left !important;
      display: inline-block;
    }
    .katex-html {
      text-align: left !important;
    }
  </style>
</head>
<body>
  <div id="content"></div>
  <script>
    try {
      const content = \`${escapedContent}\`;
      const contentDiv = document.getElementById('content');
      contentDiv.textContent = content;
      
      // Render LaTeX với KaTeX
      renderMathInElement(contentDiv, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\\\[', right: '\\\\]', display: true},
          {left: '\\\\(', right: '\\\\)', display: false}
        ],
        throwOnError: false,
        trust: true,
        strict: false
      });
      
      // Gửi chiều cao về React Native
      function sendHeight() {
        const contentDiv = document.getElementById('content');
        const height = Math.max(
          contentDiv.scrollHeight,
          contentDiv.offsetHeight,
          document.body.scrollHeight,
          document.body.offsetHeight
        );
        window.ReactNativeWebView.postMessage(JSON.stringify({ height: Math.ceil(height) }));
      }
      
      // Gửi chiều cao sau khi render xong
      setTimeout(sendHeight, 50);
      setTimeout(sendHeight, 200);
      setTimeout(sendHeight, 400);
    } catch (error) {
      console.error('KaTeX render error:', error);
      document.getElementById('content').textContent = '${content}';
    }
  </script>
</body>
</html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.height) {
        setWebViewHeight(data.height);
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

  return (
    <View style={[style, { overflow: "hidden", margin: 0, padding: 0 }]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={{
          height: webViewHeight,
          backgroundColor: "transparent",
          margin: 0,
          padding: 0,
        }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        androidLayerType={Platform.OS === "android" ? "hardware" : undefined}
        containerStyle={{ margin: 0, padding: 0 }}
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
