// ==============================|| PAGE ||============================== //

export default async function MessagesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <div>My Post: {slug}</div>;
}
