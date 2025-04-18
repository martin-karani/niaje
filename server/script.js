const fs = require('fs');
const path = require('path');

// Function to combine all files into one
function combineFiles(inputDir, outputFile) {
  let combinedContent = '';
  let fileCount = 0;

  // Function to recursively process files in a directory
  function processDirectory(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        // If it's a directory, process it recursively
        processDirectory(itemPath, prefix + item + '/');
      } else {
        // If it's a file, read its content and add to the combined content
        fileCount++;
        const content = fs.readFileSync(itemPath, 'utf8');
        const relativePath = prefix + item;
        
        combinedContent += `\n===== FILE: ${relativePath} =====\n\n`;
        combinedContent += content;
        combinedContent += '\n\n';
        
        console.log(`Processed: ${relativePath}`);
      }
    });
  }

  // Start processing from the input directory
  processDirectory(inputDir);
  
  // Write the combined content to the output file
  fs.writeFileSync(outputFile, combinedContent);
  console.log(`\nCombined ${fileCount} files into ${outputFile}`);
}

// Usage example::
const inputDirectory = './';  // Change this to your input directory
const outputFile = './combined_files.txt';  // Change this to your desired output file

combineFiles(inputDirectory, outputFile);
