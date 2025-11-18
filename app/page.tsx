import Link from "next/link"
import {
  Calendar,
  Database,
  GitBranch,
  Layers,
  Zap,
  Lock,
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

export default function Home() {
  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Advanced Gantt Visualization",
      description: "Beautiful, interactive timelines with zoom, pan, and infinite scroll capabilities",
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Universal Data Integration",
      description: "Connect to PostgreSQL, MySQL, MongoDB, Excel, Baserow, and more with ease",
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: "Version Control Built-in",
      description: "Full undo/redo, change tracking, and version history for every modification",
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Task Dependencies",
      description: "Visualize relationships with critical path analysis and smart scheduling",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Collaboration",
      description: "Work together with live updates, presence indicators, and instant sync",
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Self-hosted options with enterprise-grade security and data control",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Resource Management",
      description: "Allocate team members and track workload across all projects",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Smart Analytics",
      description: "Insights, reports, and visualizations to track project health",
    },
  ]

  const dataSources = [
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Excel",
    "Baserow",
    "Airtable",
    "Google Sheets",
  ]

  return (
    <main className="min-h-screen">
      {/* Gradient Mesh Background */}
      <div className="fixed inset-0 gradient-mesh opacity-50 -z-10" />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 glass-card rounded-full text-sm font-medium animate-fade-in">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>The Modern Project Management Platform</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 animate-slide-in">
            <span className="gradient-text">Gantt Charts</span>
            <br />
            <span className="text-foreground">Reimagined</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in">
            A powerful, intuitive platform that makes project planning effortless.
            Connect any database, track every change, and collaborate in real-time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Link
              href="/gantt"
              className="group px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-lg shadow-smooth-lg hover:shadow-glow transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              Launch Gantt Chart
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/config"
              className="px-8 py-4 glass-card rounded-2xl font-semibold text-lg hover:shadow-smooth-lg transition-all duration-300 hover:scale-105"
            >
              Configure Data Source
            </Link>
          </div>

          {/* Data Sources Badge */}
          <div className="mt-16 animate-fade-in">
            <p className="text-sm text-muted-foreground mb-4">WORKS WITH</p>
            <div className="flex flex-wrap justify-center gap-3">
              {dataSources.map((source) => (
                <span
                  key={source}
                  className="px-4 py-2 glass rounded-xl text-sm font-medium"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </section>

      {/* Features Grid */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6">
              Everything You Need
              <br />
              <span className="gradient-text">and More</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built from the ground up with modern technologies and best practices
              to deliver an unmatched project management experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group modern-card hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-12 md:p-16 text-center rounded-3xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your
              <br />
              <span className="gradient-text">Project Management?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join teams worldwide using our platform to deliver projects faster,
              with better visibility and collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/gantt"
                className="group px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-lg shadow-smooth-lg hover:shadow-glow transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Feature List */}
            <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
              {[
                "No credit card required",
                "Deploy in minutes",
                "Open source & self-hosted",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-border/50">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p className="text-sm">
            Built with Next.js, React, TypeScript, and modern web technologies.
            <br />
            Open source and free to use.
          </p>
        </div>
      </footer>
    </main>
  )
}
