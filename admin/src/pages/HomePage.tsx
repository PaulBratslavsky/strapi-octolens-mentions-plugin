import { Main, Box, Typography } from '@strapi/design-system';
import { MentionsTable } from '../components/MentionsTable';
import { useMentions } from '../hooks/useMentions';

const HomePage = () => {
  const { mentions, loading, error } = useMentions();

  return (
    <Main>
      <Box padding={8}>
        <Typography variant="alpha">
          Mentions
        </Typography>
      </Box>
      <Box paddingLeft={8} paddingRight={8}> 
        {loading && <Typography>Loading mentions...</Typography>}
        {error && <Typography textColor="danger600">Error: {error.message}</Typography>}
        {!loading && !error && <MentionsTable mentions={mentions} />}
      </Box>
    </Main>
  );
};

export { HomePage };
