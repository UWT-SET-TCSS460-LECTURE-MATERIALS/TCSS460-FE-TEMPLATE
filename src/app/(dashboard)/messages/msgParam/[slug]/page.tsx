// ==============================|| PAGE ||============================== //

export default async function MessagesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  console.dir(slug);
  return <div>My Post: {slug}</div>;
}
