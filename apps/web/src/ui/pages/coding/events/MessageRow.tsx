import { Box } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MessageRow({ messageId: _m, text, isStreaming }: { messageId: string; text: string; isStreaming?: boolean }) {
  return (
    <Box className={`prose${isStreaming ? ' is-streaming' : ''}`} px="2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </Box>
  );
}
