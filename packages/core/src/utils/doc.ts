const search = '\\*/'; // Find '*/'
const replacement = '*\\/'; // Replace With '*\/'

const regex = new RegExp(search, 'g');

export function jsDoc(
  {
    description,
    deprecated,
    summary,
  }: {
    description?: string[] | string;
    deprecated?: boolean;
    summary?: string;
  },
  tryOneLine = false,
): string {
  // Ensure there aren't any comment terminations in doc
  const lines = (
    Array.isArray(description)
      ? description.filter((d) => !d.includes('eslint-disable'))
      : [description || '']
  ).map((line) => line.replace(regex, replacement));

  const count = [description, deprecated, summary].reduce(
    (acc, it) => (it ? acc + 1 : acc),
    0,
  );

  if (!count) {
    return '';
  }

  const oneLine = count === 1 && tryOneLine;
  const eslintDisable = Array.isArray(description)
    ? description
        .find((d) => d.includes('eslint-disable'))
        ?.replace(regex, replacement)
    : undefined;
  let doc = `${eslintDisable ? `/* ${eslintDisable} */\n` : ''}/**`;

  if (description) {
    if (!oneLine) {
      doc += `\n${tryOneLine ? '  ' : ''} *`;
    }
    doc += ` ${lines.join('\n * ')}`;
  }

  if (deprecated) {
    if (!oneLine) {
      doc += `\n${tryOneLine ? '  ' : ''} *`;
    }
    doc += ' @deprecated';
  }

  if (summary) {
    if (!oneLine) {
      doc += `\n${tryOneLine ? '  ' : ''} *`;
    }
    doc += ` @summary ${summary.replace(regex, replacement)}`;
  }

  doc += !oneLine ? `\n ${tryOneLine ? '  ' : ''}` : ' ';

  doc += '*/\n';

  return doc;
}
