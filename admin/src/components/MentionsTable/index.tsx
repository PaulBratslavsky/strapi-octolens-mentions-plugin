import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  Typography,
  Checkbox,
  VisuallyHidden,
  Flex,
  Box,
  IconButton,
} from '@strapi/design-system';
import { Pencil, Trash, Eye } from '@strapi/icons';
import type { IMention } from '../../types';

const COL_COUNT = 7;

interface MentionsTableProps {
  readonly mentions: IMention[];
}

export function MentionsTable({ mentions }: MentionsTableProps) {
  return (
    <Table colCount={COL_COUNT} rowCount={mentions.length}>
      <Thead>
        <Tr>
          <Th>
            <Checkbox aria-label="Select all entries" />
          </Th>
          <Th>
            <Typography variant="sigma">Title</Typography>
          </Th>
          <Th>
            <Typography variant="sigma">Source</Typography>
          </Th>
          <Th>
            <Typography variant="sigma">Keyword</Typography>
          </Th>
          <Th>
            <Typography variant="sigma">Relevance Score</Typography>
          </Th>
          <Th>
            <Typography variant="sigma">Comment</Typography>
          </Th>
          <Th>
            <VisuallyHidden>Actions</VisuallyHidden>
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {mentions.map((mention) => (
          <Tr key={mention.documentId}>
            <Td>
              <Checkbox aria-label={`Select ${mention.title}`} />
            </Td>
            <Td>
              <Typography textColor="neutral800" fontWeight="bold">
                {mention.title || 'Untitled'}
              </Typography>
            </Td>
            <Td>
              <Typography textColor="neutral800">{mention.source}</Typography>
            </Td>
            <Td>
              <Typography textColor="neutral800">{mention.keyword}</Typography>
            </Td>
            <Td>
              <Typography textColor="neutral800">{mention.relevanceScore}</Typography>
            </Td>
            <Td>
              <Typography textColor="neutral600" ellipsis>
                {mention.relevanceComment?.substring(0, 50)}
                {mention.relevanceComment?.length > 50 ? '...' : ''}
              </Typography>
            </Td>
            <Td>
              <Flex>
                {mention.url && (
                  <IconButton
                    tag="a"
                    href={mention.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    label="View source"
                    borderWidth={0}
                  >
                    <Eye />
                  </IconButton>
                )}
                <Box paddingLeft={1}>
                  <IconButton
                    onClick={() => console.log('edit', mention.documentId)}
                    label="Edit"
                    borderWidth={0}
                  >
                    <Pencil />
                  </IconButton>
                </Box>
                <Box paddingLeft={1}>
                  <IconButton
                    onClick={() => console.log('delete', mention.documentId)}
                    label="Delete"
                    borderWidth={0}
                  >
                    <Trash />
                  </IconButton>
                </Box>
              </Flex>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
