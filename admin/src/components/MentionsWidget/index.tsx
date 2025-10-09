import { Box, Typography } from '@strapi/design-system';
import { useMentions } from '../../hooks/useMentions';
import { MentionsTable } from '../MentionsTable';

export function MentionsWidget() {
  const { mentions, loading, error } = useMentions();

  if (loading) {
    return (
      <Box padding={4}>
        <Typography>Loading mentions...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={4}>
        <Typography textColor="danger600">Error: {error.message}</Typography>
      </Box>
    );
  }

  return (
    <Box padding={4}>
      <MentionsTable mentions={mentions} />
    </Box>
  );
}
