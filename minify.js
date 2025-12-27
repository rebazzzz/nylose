const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Directories to minify
const jsDir = "js";
const cssDir = "styles";
const minJsDir = "js/min";
const minCssDir = "styles/min";

// Ensure min directories exist
if (!fs.existsSync(minJsDir)) {
  fs.mkdirSync(minJsDir, { recursive: true });
}
if (!fs.existsSync(minCssDir)) {
  fs.mkdirSync(minCssDir, { recursive: true });
}

// Function to minify JS files
function minifyJS() {
  const jsFiles = fs.readdirSync(jsDir).filter((file) => file.endsWith(".js"));
  jsFiles.forEach((file) => {
    const inputPath = path.join(jsDir, file);
    const outputPath = path.join(minJsDir, file.replace(".js", ".min.js"));
    try {
      execSync(
        `npx uglifyjs "${inputPath}" -o "${outputPath}" --compress --mangle`
      );
      console.log(`Minified JS: ${file} -> ${path.basename(outputPath)}`);
    } catch (error) {
      console.error(`Error minifying ${file}:`, error.message);
    }
  });
}

// Function to minify CSS files
function minifyCSS() {
  const cssFiles = fs
    .readdirSync(cssDir)
    .filter((file) => file.endsWith(".css"));
  cssFiles.forEach((file) => {
    const inputPath = path.join(cssDir, file);
    const outputPath = path.join(minCssDir, file.replace(".css", ".min.css"));
    try {
      execSync(`npx cleancss -o "${outputPath}" "${inputPath}"`);
      console.log(`Minified CSS: ${file} -> ${path.basename(outputPath)}`);
    } catch (error) {
      console.error(`Error minifying ${file}:`, error.message);
    }
  });
}

// Run minification
console.log("Starting minification...");
minifyJS();
minifyCSS();
console.log("Minification complete!");
