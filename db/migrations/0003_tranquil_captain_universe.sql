CREATE TABLE `github_configuration` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`appId` text NOT NULL,
	`clientId` text NOT NULL,
	`clientSecret` text NOT NULL,
	`privateKey` text NOT NULL,
	`installationId` text,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `benchmark_run` ADD `parallelWorkers` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `benchmark` ADD `parallelWorkers` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `repository` ADD `githubConfigurationId` text REFERENCES github_configuration(id);