const filterEmptyParagraphsDeep = ( blocks ) => {
  return blocks
    .filter((block) => {
      if (
        block.name === "core/paragraph" &&
        ["", "<br>"].includes( block.attributes.content.trim() )
      ) {
        return false; // Remove empty paragraphs
      }
      return true;
    })
    .map((block) => {
      if (block.innerBlocks && block.innerBlocks.length > 0) {
        block.innerBlocks = filterEmptyParagraphsDeep(block.innerBlocks);
      }
      return block;
    });
}

export default filterEmptyParagraphsDeep;