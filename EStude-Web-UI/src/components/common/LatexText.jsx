import React, { useEffect, useRef, useState } from "react";

/**
 * Component hiển thị text có chứa LaTeX sử dụng KaTeX
 * Hỗ trợ inline math: $...$ hoặc \(...\)
 * Hỗ trợ display math: $$...$$ hoặc \[...\] hoặc \begin{...}...\end{...}
 */
const LatexText = ({ children, className = "", style = {} }) => {
  const containerRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);

  // Chuẩn hóa nội dung: Chuyển $...$ thành \(...\) để KaTeX xử lý chính xác
  const normalizeLatex = (text) => {
    if (!text || typeof text !== "string") return text;

    // Chuyển $$...$$ thành \[...\] (display math)
    let normalized = text.replace(/\$\$([^\$]+)\$\$/g, "\\[$1\\]");

    // Chuyển $...$ thành \(...\) (inline math)
    normalized = normalized.replace(/\$([^\$]+)\$/g, "\\($1\\)");

    return normalized;
  };

  // Kiểm tra xem content có chứa LaTeX không
  const checkHasLatex = (text) => {
    if (!text || typeof text !== "string") return false;

    // Kiểm tra các LaTeX delimiters sau khi normalize
    return (
      text.includes("\\(") ||
      text.includes("\\[") ||
      text.includes("\\begin") ||
      text.includes("\\frac") ||
      text.includes("\\sqrt") ||
      text.includes("\\le") ||
      text.includes("\\ge") ||
      text.includes("\\sum") ||
      text.includes("\\int") ||
      text.includes("\\alpha") ||
      text.includes("\\beta") ||
      text.includes("\\cases")
    );
  };

  const rawContent =
    typeof children === "string" ? children : String(children || "");

  // Chuẩn hóa content trước khi kiểm tra và render
  const content = normalizeLatex(rawContent);
  const hasLatex = checkHasLatex(content);

  useEffect(() => {
    if (!hasLatex || !containerRef.current) return;

    const renderLatex = () => {
      if (
        !containerRef.current ||
        !window.renderMathInElement ||
        !window.katex
      ) {
        console.warn("⚠️ KaTeX or renderMathInElement not ready");
        return;
      }

      try {
        // Clear previous render
        containerRef.current.innerHTML = content;

        // Render LaTeX
        window.renderMathInElement(containerRef.current, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false },
          ],
          throwOnError: false,
          trust: true,
          strict: false,
        });

        setIsRendered(true);
        console.log("✅ KaTeX rendered successfully");
      } catch (error) {
        console.error("❌ KaTeX render error:", error);
        // Fallback: show plain text if render fails
        containerRef.current.textContent = content;
      }
    };

    // Load KaTeX nếu chưa có
    const loadKatex = () => {
      // Nếu đã có đầy đủ katex và renderMathInElement, render ngay
      if (window.katex && window.renderMathInElement) {
        console.log("✅ KaTeX already loaded, rendering...");
        renderLatex();
        return;
      }

      console.log("📦 Loading KaTeX from CDN...");

      // Load KaTeX CSS
      if (!document.getElementById("katex-css")) {
        const link = document.createElement("link");
        link.id = "katex-css";
        link.rel = "stylesheet";
        link.href =
          "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }

      // Helper function to load script
      const loadScript = (src, id) => {
        return new Promise((resolve, reject) => {
          if (document.getElementById(id)) {
            resolve();
            return;
          }

          const script = document.createElement("script");
          script.id = id;
          script.src = src;
          script.crossOrigin = "anonymous";
          script.onload = () => {
            console.log(`✅ Loaded: ${id}`);
            resolve();
          };
          script.onerror = () => {
            console.error(`❌ Failed to load: ${src}`);
            reject(new Error(`Failed to load ${src}`));
          };
          document.head.appendChild(script);
        });
      };

      // Load KaTeX main library, then auto-render extension
      loadScript(
        "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js",
        "katex-js"
      )
        .then(() => {
          // Wait for KaTeX object to be available
          return new Promise((resolve) => {
            const checkKatex = () => {
              if (window.katex) {
                console.log("✅ KaTeX main library loaded");
                resolve();
              } else {
                setTimeout(checkKatex, 10);
              }
            };
            checkKatex();
          });
        })
        .then(() => {
          // Load auto-render extension
          return loadScript(
            "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js",
            "katex-auto-render"
          );
        })
        .then(() => {
          // Wait for renderMathInElement to be available
          return new Promise((resolve) => {
            const checkRender = () => {
              if (window.renderMathInElement) {
                console.log("✅ KaTeX auto-render extension loaded");
                resolve();
              } else {
                setTimeout(checkRender, 10);
              }
            };
            checkRender();
          });
        })
        .then(() => {
          // Small delay to ensure everything is ready
          setTimeout(() => {
            renderLatex();
          }, 50);
        })
        .catch((error) => {
          console.error("❌ Error loading KaTeX:", error);
          // Fallback: show plain text
          if (containerRef.current) {
            containerRef.current.textContent = content;
          }
        });
    };

    loadKatex();
  }, [content, hasLatex]);

  // Nếu không có LaTeX, render như text bình thường
  if (!hasLatex) {
    return (
      <span className={className} style={style}>
        {content}
      </span>
    );
  }

  // Có LaTeX thì render với KaTeX
  return (
    <span
      ref={containerRef}
      className={`latex-content ${className}`}
      style={{
        textAlign: "left",
        display: "inline",
        ...style,
      }}
    >
      {content}
    </span>
  );
};

export default LatexText;
