import { Save } from "lucide-react";
import { useState } from "react";
import ProfileImageUpload from "./ProfileImageUpload";

function toDateInputValue(value) {
    if (!value) return "";

    if (typeof value === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        const date = new Date(value);
        return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
    }

    if (value instanceof Date && !isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }

    return "";
}

export default function EditProfileForm({ onProfileUpdate, currentUser }) {

    const [formData, setFormData] = useState({
        coverImageUrl: currentUser.coverImageUrl,
        avatarUrl: currentUser.avatarUrl,
        name: currentUser.name,
        username: currentUser.username,
        jobTitle: currentUser.jobTitle,
        location: currentUser.location,
        website: currentUser.website,
        dateOfBirth: toDateInputValue(currentUser.dateOfBirth),
        bio: currentUser.bio,
        skills: (currentUser.skills || []).join(", "),
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();

        const skills = formData.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean);

        onProfileUpdate({
            name: formData.name,
            jobTitle: formData.jobTitle,
            location: formData.location,
            website: formData.website,
            bio: formData.bio,
            dateOfBirth: formData.dateOfBirth,
            skills,
            avatarImage: avatarFile,
            coverImage: coverFile,
        });
    }
    

    return (
        <section className="content-card-padded">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                    <ProfileImageUpload
                        variant="cover"
                        imageSrc={formData.coverImageUrl}
                        originalImageSrc={currentUser.coverImageUrl}
                        onImageChange={(imageUrl, file) => {
                            setCoverFile(file);
                            setFormData((currentData) => ({ ...currentData, coverImageUrl: imageUrl }));
                        }}
                        alt="Profile Cover"
                    />

                    <ProfileImageUpload
                        variant="avatar"
                        imageSrc={formData.avatarUrl}
                        originalImageSrc={currentUser.avatarUrl}
                        onImageChange={(imageUrl, file) => {
                            setAvatarFile(file);
                            setFormData((currentData) => ({ ...currentData, avatarUrl: imageUrl }));
                        }}
                        alt="Profile Avatar"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="display-name" className="type-body-sm text-(--primary)">
                            Display Name
                        </label>

                        <input
                            id="display-name"
                            name="name"
                            type="text"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="username" className="type-body-sm text-(--primary)">
                            Username
                        </label>

                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            disabled
                            title="Username can't be changed"
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="jobTitle" className="type-body-sm text-(--primary)">
                            Job Title
                        </label>

                        <input
                            id="jobTitle"
                            name="jobTitle"
                            type="text"
                            placeholder="Job Title"
                            value={formData.jobTitle}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="location" className="type-body-sm text-(--primary)">
                            Location
                        </label>

                        <input
                            id="location"
                            name="location"
                            type="text"
                            placeholder="Location"
                            value={formData.location}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="website" className="type-body-sm text-(--primary)">
                            Website
                        </label>

                        <input
                            id="website"
                            name="website"
                            type="text"
                            placeholder="Website"
                            value={formData.website}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="date-of-birth" className="type-body-sm text-(--primary)">
                            Date Of Birth
                        </label>
                        <input
                            id="date-of-birth"
                            name="dateOfBirth"
                            type="date"
                            placeholder="Date Of Birth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label htmlFor="skills" className="type-body-sm text-(--primary)">
                            Skills & Interests
                        </label>

                        <input
                            id="skills"
                            name="skills"
                            type="text"
                            placeholder="React, UI Design, Accessibility"
                            value={formData.skills}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />

                        <p className="type-label-sm text-secondary">
                            Separate each skill or interest with a comma.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label htmlFor="bio" className="type-body-sm text-(--primary)">
                            Bio
                        </label>

                        <textarea
                            id="bio"
                            name="bio"
                            placeholder="Bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={4}
                            className="input-surface type-body-sm w-full resize-none rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>
                </div>

                <button type="submit" className="button-primary mx-auto flex w-50 items-center justify-center gap-2 p-3">
                    <Save size={18} />
                    Save Changes
                </button>
            </form>
        </section>
    );
}
