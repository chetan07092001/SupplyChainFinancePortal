import React from "react";
import { Container, Grid, Card, CardContent, Skeleton, Box } from "@mui/material";

const Loader = () => {
  return (
    <Box display="flex">
      {/* Side Panel Skeleton */}
      <Box width={240} height={480} p={2} bgcolor="#f5f5f5">
        <Skeleton variant="rectangular" width={160} height={40} sx={{ mb: 3 }} /> {/* Logo */}
        {/* Side menu items */}
        <Skeleton variant="text" width={120} height={30} sx={{ mb: 2 }} />
        <Skeleton variant="text" width={120} height={30} sx={{ mb: 2 }} />
        <Skeleton variant="text" width={120} height={30} sx={{ mb: 2 }} />
        <Skeleton variant="text" width={120} height={30} sx={{ mb: 2 }} />
      </Box>

      {/* Dashboard Content Skeleton */}
      <Container maxWidth="lg" sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {/* First Row */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width={120} height={30} />
                <Skeleton variant="text" width={80} height={50} />
                <Skeleton variant="text" width={150} height={20} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width={120} height={30} />
                <Skeleton variant="text" width={80} height={50} />
                <Skeleton variant="text" width={150} height={20} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width={120} height={30} />
                <Skeleton variant="text" width={80} height={50} />
                <Skeleton variant="text" width={150} height={20} />
              </CardContent>
            </Card>
          </Grid>

          {/* Second Row (Charts) */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width={200} height={30} />
                <Skeleton variant="rectangular" width="100%" height={200} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width={200} height={30} />
                <Skeleton variant="rectangular" width="100%" height={200} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Loader;
