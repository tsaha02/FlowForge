import { z } from 'zod';
const schema = z.object({
  params: z.object({ id: z.string().cuid() })
});
async function run() {
  try {
    const res = await schema.parseAsync({
      body: undefined,
      query: {},
      params: { id: 'cm7iyrj5r0000rwnc0g1r5rve' }
    });
    console.log("SUCCESS:", res);
  } catch(e) {
    console.log("ERROR:", e);
  }
}
run();
