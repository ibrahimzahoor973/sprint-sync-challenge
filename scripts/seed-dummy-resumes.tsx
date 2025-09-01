import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getPineconeStore } from "../lib/pinecone";

const dummyResumes = [
  {
    id: "resume-1",
    text: "John Doe is a software engineer with 5 years of experience in web development, specializing in React and Node.js.",
    metadata: { name: "John Doe", role: "Software Engineer", experience: 5, email: "john.doe@gmail.com" }
  },
  {
    id: "resume-2",
    text: "Jane Smith is a data scientist skilled in Python, machine learning, and data visualization.",
    metadata: { name: "Jane Smith", role: "Data Scientist", experience: 3, email: "jane.smith@gmail.com" }
  },
  {
    id: "resume-3",
    text: "Alice Johnson is a project manager with expertise in Agile methodologies and team leadership.",
    metadata: { name: "Alice Johnson", role: "Project Manager", experience: 7, email: "alice.johnson@gmail.com" }
  },
  {
    id: "resume-4",
    text: "Michael Brown is a backend engineer with a focus on distributed systems, databases, and API design.",
    metadata: { name: "Michael Brown", role: "Backend Engineer", experience: 6, email: "michael.brown@gmail.com" }
  },
  {
    id: "resume-5",
    text: "Emily Davis is a frontend developer experienced in Next.js, Tailwind CSS, and UI/UX best practices.",
    metadata: { name: "Emily Davis", role: "Frontend Developer", experience: 4, email: "emily.davis@gmail.com" }
  },
  {
    id: "resume-6",
    text: "Robert Wilson is a DevOps engineer skilled in Kubernetes, Docker, CI/CD pipelines, and cloud infrastructure.",
    metadata: { name: "Robert Wilson", role: "DevOps Engineer", experience: 8, email: "robert.wilson@gmail.com" }
  },
  {
    id: "resume-7",
    text: "Sophia Martinez is a QA engineer specializing in automated testing frameworks like Cypress and Playwright.",
    metadata: { name: "Sophia Martinez", role: "QA Engineer", experience: 5, email: "sophia.martinez@gmail.com" }
  },
  {
    id: "resume-8",
    text: "David Anderson is a data engineer with expertise in ETL pipelines, Apache Spark, and big data systems.",
    metadata: { name: "David Anderson", role: "Data Engineer", experience: 6, email: "david.anderson@gmail.com" }
  },
  {
    id: "resume-9",
    text: "Olivia Thomas is a UI/UX designer skilled in Figma, user research, and creating accessible designs.",
    metadata: { name: "Olivia Thomas", role: "UI/UX Designer", experience: 4, email: "olivia.thomas@gmail.com" }
  },
  {
    id: "resume-10",
    text: "James Taylor is a mobile developer with experience in React Native and Swift.",
    metadata: { name: "James Taylor", role: "Mobile Developer", experience: 5, email: "james.taylor@gmail.com" }
  },
  {
    id: "resume-11",
    text: "Isabella Lee is a machine learning engineer with knowledge of NLP, TensorFlow, and PyTorch.",
    metadata: { name: "Isabella Lee", role: "ML Engineer", experience: 3, email: "isabella.lee@gmail.com" }
  },
  {
    id: "resume-12",
    text: "William Harris is a cloud architect experienced in AWS, Azure, and designing scalable infrastructures.",
    metadata: { name: "William Harris", role: "Cloud Architect", experience: 10, email: "william.harris@gmail.com" }
  },
  {
    id: "resume-13",
    text: "Mia Clark is a security engineer focusing on penetration testing, network security, and threat detection.",
    metadata: { name: "Mia Clark", role: "Security Engineer", experience: 7, email: "mia.clark@gmail.com" }
  },
  {
    id: "resume-14",
    text: "Ethan Lewis is a database administrator with expertise in PostgreSQL, MySQL, and query optimization.",
    metadata: { name: "Ethan Lewis", role: "Database Administrator", experience: 9, email: "ethan.lewis@gmail.com" }
  },
  {
    id: "resume-15",
    text: "Charlotte Walker is a technical writer experienced in API documentation and developer guides.",
    metadata: { name: "Charlotte Walker", role: "Technical Writer", experience: 6, email: "charlotte.walker@gmail.com" }
  },
  {
    id: "resume-16",
    text: "Benjamin Hall is a system administrator managing Linux servers, Active Directory, and IT automation.",
    metadata: { name: "Benjamin Hall", role: "System Administrator", experience: 8, email: "benjamin.hall@gmail.com" }
  },
  {
    id: "resume-17",
    text: "Amelia Allen is a product manager skilled in roadmap planning, stakeholder communication, and Agile delivery.",
    metadata: { name: "Amelia Allen", role: "Product Manager", experience: 5, email: "amelia.allen@gmail.com" }
  },
  {
    id: "resume-18",
    text: "Lucas Young is a software engineer specializing in TypeScript, GraphQL, and microservices.",
    metadata: { name: "Lucas Young", role: "Software Engineer", experience: 4, email: "lucas.young@gmail.com" }
  },
  {
    id: "resume-19",
    text: "Harper Hernandez is an AI researcher with experience in generative models and reinforcement learning.",
    metadata: { name: "Harper Hernandez", role: "AI Researcher", experience: 3, email: "harper.hernandez@gmail.com" }
  },
  {
    id: "resume-20",
    text: "Alexander King is a site reliability engineer skilled in monitoring, observability, and on-call operations.",
    metadata: { name: "Alexander King", role: "SRE", experience: 6, email: "alexander.king@gmail.com" }
  },
  {
    id: "resume-21",
    text: "Evelyn Scott is a business analyst experienced in requirements gathering, SQL queries, and data analysis.",
    metadata: { name: "Evelyn Scott", role: "Business Analyst", experience: 5, email: "evelyn.scott@gmail.com" }
  },
  {
    id: "resume-22",
    text: "Daniel Green is a robotics engineer with skills in ROS, C++, and sensor integration.",
    metadata: { name: "Daniel Green", role: "Robotics Engineer", experience: 4, email: "daniel.green@gmail.com" }
  },
  {
    id: "resume-23",
    text: "Aria Adams is a software tester focused on manual testing, test planning, and bug tracking systems.",
    metadata: { name: "Aria Adams", role: "Software Tester", experience: 3, email: "aria.adams@gmail.com" }
  },
  {
    id: "resume-24",
    text: "Henry Baker is a blockchain developer with expertise in Solidity, smart contracts, and Ethereum.",
    metadata: { name: "Henry Baker", role: "Blockchain Developer", experience: 5, email: "henry.baker@gmail.com" }
  },
  {
    id: "resume-25",
    text: "Scarlett Nelson is a frontend engineer passionate about performance optimization and accessibility.",
    metadata: { name: "Scarlett Nelson", role: "Frontend Engineer", experience: 4, email: "scarlett.nelson@gmail.com" }
  },
  {
    id: "resume-26",
    text: "Jack Carter is an embedded systems engineer with skills in C, C++, and hardware programming.",
    metadata: { name: "Jack Carter", role: "Embedded Engineer", experience: 7, email: "jack.carter@gmail.com" }
  },
  {
    id: "resume-27",
    text: "Lily Mitchell is a customer success engineer experienced in client onboarding and technical support.",
    metadata: { name: "Lily Mitchell", role: "Customer Success Engineer", experience: 5, email: "lily.mitchell@gmail.com" }
  },
  {
    id: "resume-28",
    text: "Samuel Perez is a game developer with expertise in Unity, Unreal Engine, and gameplay programming.",
    metadata: { name: "Samuel Perez", role: "Game Developer", experience: 6, email: "samuel.perez@gmail.com" }
  },
  {
    id: "resume-29",
    text: "Victoria Roberts is a software engineer with a strong background in Golang and distributed systems.",
    metadata: { name: "Victoria Roberts", role: "Software Engineer", experience: 5, email: "victoria.roberts@gmail.com" }
  },
  {
    id: "resume-30",
    text: "Elijah Turner is a research scientist specializing in computer vision and applied AI.",
    metadata: { name: "Elijah Turner", role: "Research Scientist", experience: 8, email: "elijah.turner@gmail.com" }
  }
];


async function seedDummyResumes() {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const vectorStore = getPineconeStore(embeddings);

  const docs = dummyResumes.map(
    (data) =>
      new Document({
        pageContent: data.text,
        metadata: data.metadata,
        id: data.id,
      })
  );

  await vectorStore.addDocuments(docs);

  console.log("Dummy resumes embedded and uploaded to Pinecone successfully.");
}

seedDummyResumes().catch((err) => {
  console.error("Error seeding dummy resumes:", err);
  process.exit(1);
});