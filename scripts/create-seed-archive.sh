#!/bin/bash

echo "📦 Creating seed data archive..."

# Create a temporary directory for the archive
TEMP_DIR=$(mktemp -d)
ARCHIVE_NAME="isodisplay-seed-data-$(date +%Y%m%d).tar.gz"

# Copy seed data files
echo "📄 Copying seed data files..."
cp prisma/seed-data.json "$TEMP_DIR/"

# Copy uploads folder structure
echo "📁 Copying uploads folder..."
if [ -d "uploads" ]; then
  cp -r uploads "$TEMP_DIR/"
  echo "✅ Uploads folder copied"
else
  echo "⚠️  No uploads folder found"
fi

# Create the archive
echo "🗜️  Creating archive..."
tar -czf "$ARCHIVE_NAME" -C "$TEMP_DIR" .

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo "✅ Archive created: $ARCHIVE_NAME"
echo ""
echo "📝 To use this seed data in a new installation:"
echo "  1. Extract the archive in the project root:"
echo "     tar -xzf $ARCHIVE_NAME"
echo "  2. Move seed-data.json to prisma folder:"
echo "     mv seed-data.json prisma/"
echo "  3. The uploads folder will be in the correct location"
echo "  4. Run the database seed:"
echo "     npm run db:seed"